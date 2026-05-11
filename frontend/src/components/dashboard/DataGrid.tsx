import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridOptions } from "ag-grid-community";

interface Props<T> {
  rowData: T[];
  columnDefs: ColDef<T>[];
  height?: number;
  gridOptions?: GridOptions<T>;
}

export default function DataGrid<T>({
  rowData,
  columnDefs,
  height = 400,
  gridOptions,
}: Props<T>) {
  return (
    <div className="ag-theme-alpine w-full rounded-lg overflow-hidden border border-cream-300" style={{ height }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{
          flex: 1,
          minWidth: 100,
          resizable: true,
          sortable: true,
          filter: true,
        }}
        animateRows
        pagination
        paginationPageSize={20}
        {...gridOptions}
      />
    </div>
  );
}
