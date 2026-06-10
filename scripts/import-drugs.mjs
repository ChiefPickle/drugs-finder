import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const DEFAULT_XLSX = resolve(
  process.env.DRUGS_XLSX_PATH ||
    "/Users/yanchelly/Downloads/files_databases_drugs_drug-prices_tm_tm_31122025.xlsx"
);
const OUTPUT = resolve(root, "src/data/drugs.json");

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function main() {
  if (!existsSync(DEFAULT_XLSX)) {
    if (existsSync(OUTPUT)) {
      console.log(`Excel not found; using existing ${OUTPUT}`);
      return;
    }
    console.error(`Excel file not found: ${DEFAULT_XLSX}`);
    console.error("Set DRUGS_XLSX_PATH to the correct path and retry.");
    process.exit(1);
  }

  const workbook = XLSX.readFile(DEFAULT_XLSX);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });

  const headerRow = rows[1];
  if (!headerRow || headerRow[0] !== "קוד") {
    console.error("Unexpected Excel format — expected header row with 'קוד'");
    process.exit(1);
  }

  const drugs = rows.slice(2).flatMap((row, index) => {
    const cells = row;
    const code = toString(cells[0]);
    const name = toString(cells[1]);
    if (!code || !name) return [];

    return [
      {
        id: code,
        code,
        name,
        packageSize: toString(cells[2]),
        maxRetailPrice: toNumber(cells[3]),
        retailerMarginPercent: toNumber(cells[4]),
        maxConsumerPrice: toNumber(cells[5]),
        maxConsumerPriceWithVat: toNumber(cells[6]),
        manufacturer: toString(cells[7]),
        yerpaCode: toString(cells[8]),
        farmasoftCode: toString(cells[9]),
        rowIndex: index + 3,
      },
    ];
  });

  mkdirSync(resolve(root, "src/data"), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(drugs));
  console.log(`Imported ${drugs.length} drugs from "${sheetName}" → ${OUTPUT}`);
}

main();
