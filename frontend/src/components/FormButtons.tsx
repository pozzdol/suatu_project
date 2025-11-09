import {
  ArrowsClockwiseIcon,
  FileArrowDownIcon,
  FileCsvIcon,
  FilePlusIcon,
  FileXlsIcon,
  FloppyDiskBackIcon,
  FloppyDiskIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Ban } from "lucide-react";
import { utils as XLSXUtils, write as XLSXWrite } from "xlsx";

interface FormButtonsProps {
  activeButtons?: string[];
  onNew?: () => void;
  onSave?: () => void;
  onSaveClose?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
  // Add new props for export
  tableData?: any[];
  tableHeaders?: Array<{
    label: string;
    field: string;
  }>;
  fileName?: string;
  disabled?: boolean;
  actions?: React.ReactNode;
}

function FormButtons({
  activeButtons = [],
  onNew,
  onSave,
  onSaveClose,
  onCancel,
  onDelete,
  onRefresh,
  tableData,
  tableHeaders,
  fileName = "exported-data",
  disabled = false,
  actions,
}: FormButtonsProps) {
  const isActive = (key: string) => activeButtons.includes(key);

  const getCurrentTimestamp = () => {
    const now = new Date();
    return now
      .toISOString()
      .slice(0, 19)
      .replace(/[-:]/g, "")
      .replace("T", "_");
  };

  const handleExport = (type: "csv" | "xlsx") => {
    if (!tableData || !tableHeaders) return;

    // Transform data to match header labels
    const exportData = tableData.map((item) => {
      const row: { [key: string]: any } = {};
      tableHeaders.forEach((header) => {
        row[header.label] = item[header.field];
      });
      return row;
    });

    if (type === "csv") {
      // Create CSV content
      const headers = tableHeaders.map((h) => h.label);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => `"${row[header]}"`).join(",")
        ),
      ].join("\n");

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `${fileName}_${getCurrentTimestamp()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create XLSX workbook
      const ws = XLSXUtils.json_to_sheet(exportData);
      const wb = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(wb, ws, "Sheet1");

      // Generate and download XLSX file
      const wbout = XLSXWrite(wb, { bookType: "xlsx", type: "binary" });
      const buf = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < wbout.length; i++)
        view[i] = wbout.charCodeAt(i) & 0xff;

      const blob = new Blob([buf], { type: "application/octet-stream" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `${fileName}_${getCurrentTimestamp()}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const buttonClasses = (buttonKey: string) => {
    const baseClasses =
      "p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200";
    const isEnabled = isActive(buttonKey) && !disabled;

    if (!isEnabled) {
      return `${baseClasses} opacity-40 cursor-not-allowed bg-gray-100`;
    }

    return `${baseClasses} hover:bg-gray-100 active:scale-95 cursor-pointer`;
  };

  const iconClasses = (buttonKey: string) => {
    const baseClasses = "w-5 h-5 transition-colors duration-200";
    const isEnabled = isActive(buttonKey) && !disabled;

    if (!isEnabled) {
      return `${baseClasses} text-gray-300`;
    }

    return `${baseClasses} text-gray-600 hover:text-gray-900`;
  };

  return (
    <div className="bg-white rounded-t-lg border-b border-gray-200">
      <div className="flex justify-between items-center px-4 py-3">
        <div
          className={`flex items-center gap-1 ${disabled ? "opacity-50" : ""}`}
        >
          {/* New Button */}
          <button
            onClick={onNew}
            disabled={!isActive("new") || disabled}
            className={buttonClasses("new")}
            title="New"
          >
            <FilePlusIcon weight="duotone" className={iconClasses("new")} />
          </button>

          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={!isActive("save") || disabled}
            className={buttonClasses("save")}
            title="Save"
          >
            <FloppyDiskIcon weight="duotone" className={iconClasses("save")} />
          </button>

          {/* Save & Close Button */}
          <button
            onClick={onSaveClose}
            disabled={!isActive("saveClose") || disabled}
            className={buttonClasses("saveClose")}
            title="Save & Close"
          >
            <FloppyDiskBackIcon className={iconClasses("saveClose")} />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            disabled={!isActive("cancel") || disabled}
            className={buttonClasses("cancel")}
            title="Cancel"
          >
            <Ban className={iconClasses("cancel")} />
          </button>

          {/* Delete Button */}
          <button
            onClick={onDelete}
            disabled={!isActive("delete") || disabled}
            className={buttonClasses("delete")}
            title="Delete"
          >
            <TrashIcon weight="duotone" className={iconClasses("delete")} />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={!isActive("refresh") || disabled}
            className={buttonClasses("refresh")}
            title="Refresh"
          >
            <ArrowsClockwiseIcon className={iconClasses("refresh")} />
          </button>

          {/* Export Button with Dropdown */}
          <div className="relative group">
            <button
              disabled={!isActive("export") || disabled || !tableData}
              className={buttonClasses("export")}
              title="Export"
            >
              <FileArrowDownIcon className={iconClasses("export")} />
            </button>

            {/* Export Dropdown */}
            {isActive("export") && !disabled && tableData && (
              <div className="hidden group-hover:block absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3"
                >
                  <FileCsvIcon className="text-green-600" />
                  Export as CSV
                </button>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={() => handleExport("xlsx")}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3"
                >
                  <FileXlsIcon className="text-green-600" />
                  Export as Excel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions Section */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export default FormButtons;
