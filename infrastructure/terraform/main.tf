terraform {
  required_version = ">= 1.8"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  # Uncomment for remote state
  # backend "gcs" {
  #   bucket = "YOUR_TF_STATE_BUCKET"
  #   prefix = "xrd-platform/state"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ── APIs ──────────────────────────────────────────────────────────────────────
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "container.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

# ── Artifact Registry ─────────────────────────────────────────────────────────
resource "google_artifact_registry_repository" "xrd" {
  location      = var.region
  repository_id = "xrd"
  format        = "DOCKER"
  depends_on    = [google_project_service.apis]
}

# ── Cloud SQL ─────────────────────────────────────────────────────────────────
resource "google_sql_database_instance" "xrd_postgres" {
  name             = "xrd-postgres"
  database_version = "POSTGRES_16"
  region           = var.region
  depends_on       = [google_project_service.apis]

  settings {
    tier              = "db-g1-small"
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"
    disk_autoresize   = true
    disk_size         = 20

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = "projects/${var.project_id}/global/networks/default"
    }
  }

  deletion_protection = var.environment == "production"
}

resource "google_sql_database" "xrd_db" {
  name     = "xrd_db"
  instance = google_sql_database_instance.xrd_postgres.name
}

resource "google_sql_user" "xrd_user" {
  name     = "xrd_user"
  instance = google_sql_database_instance.xrd_postgres.name
  password = var.db_password
}

# ── Secret Manager ────────────────────────────────────────────────────────────
resource "google_secret_manager_secret" "db_url" {
  secret_id  = "xrd-db-url"
  depends_on = [google_project_service.apis]

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_url" {
  secret = google_secret_manager_secret.db_url.id
  secret_data = "postgresql+asyncpg://xrd_user:${var.db_password}@/xrd_db?host=/cloudsql/${var.project_id}:${var.region}:${google_sql_database_instance.xrd_postgres.name}"
}

# ── Service Account (backend) ─────────────────────────────────────────────────
resource "google_service_account" "backend" {
  account_id   = "xrd-backend-sa"
  display_name = "XRD Backend Service Account"
}

resource "google_project_iam_member" "backend_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_secret_manager_secret_iam_member" "backend_secret" {
  secret_id = google_secret_manager_secret.db_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

# ── Cloud Run — Backend ───────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "backend" {
  name     = "xrd-backend"
  location = var.region
  depends_on = [
    google_project_service.apis,
    google_sql_database_instance.xrd_postgres,
  ]

  template {
    service_account = google_service_account.backend.email

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.xrd_postgres.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/xrd/backend:latest"

      ports {
        container_port = 8000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "GCP_PROJECT"
        value = var.project_id
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }
}

# ── Cloud Run — Frontend ──────────────────────────────────────────────────────
resource "google_cloud_run_v2_service" "frontend" {
  name     = "xrd-frontend"
  location = var.region
  depends_on = [google_project_service.apis]

  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/xrd/frontend:latest"

      ports {
        container_port = 80
      }

      resources {
        limits = {
          cpu    = "0.5"
          memory = "256Mi"
        }
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }
}

resource "google_cloud_run_service_iam_member" "frontend_public" {
  location = google_cloud_run_v2_service.frontend.location
  service  = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "backend_public" {
  location = google_cloud_run_v2_service.backend.location
  service  = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
