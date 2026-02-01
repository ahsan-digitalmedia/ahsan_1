/**
 * CSV Utility for Parsing and Generating CSV strings.
 * Handles multi-line cells, quotes, and Excel compatibility.
 */

/**
 * Parses a CSV string into an array of objects.
 * Handles quoted fields with embedded newlines and commas.
 * @param {string} csvText 
 * @param {string[]} expectedHeaders 
 * @returns {Object[]}
 */
export function parseCSV(csvText, expectedHeaders = []) {
    if (!csvText || csvText.trim() === '') return [];

    // Strip UTF-8 BOM and common zero-width characters
    let content = csvText.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Detect separator
    let separator = ',';
    if (content.startsWith('sep=')) {
        // Explicit separator defined by Excel
        const firstLineMatch = content.match(/^sep=(.)/);
        if (firstLineMatch) {
            separator = firstLineMatch[1];
        }
        const firstNewLine = content.indexOf('\n');
        if (firstNewLine !== -1) {
            content = content.substring(firstNewLine + 1);
        }
    } else {
        // Auto-detect separator based on first line frequency
        const firstLineEnd = content.indexOf('\n');
        const firstLine = firstLineEnd === -1 ? content : content.substring(0, firstLineEnd);

        const commaCount = (firstLine.match(/,/g) || []).length;
        const semiCount = (firstLine.match(/;/g) || []).length;

        // If semicolons are significantly more frequent, assume semicolon separator
        // This is common for Indonesian/European Excel formats
        if (semiCount > commaCount) {
            separator = ';';
        }
    }

    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentField += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === separator) {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\r' && nextChar === '\n') {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
                i++;
            } else if (char === '\n' || char === '\r') {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }

    if (currentField !== '' || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    if (rows.length < 1) return [];

    // Clean headers: trim and lowercase
    // Remove empty header columns that might result from trailing separators
    const headers = rows[0].map(h => h.trim().toLowerCase().replace(/["']/g, ''));

    // Check headers if provided
    if (expectedHeaders.length > 0) {
        const lowerExpected = expectedHeaders.map(h => h.toLowerCase().trim());
        const missing = lowerExpected.filter(h => !headers.includes(h));

        if (missing.length > 0) {
            console.error('Expected Headers:', lowerExpected);
            console.error('Found Headers:', headers);
            console.error('Detected Separator:', separator);

            let detailedError = `Format Header Tidak Sesuai!\n`;
            detailedError += `Sistem mendeteksi pemisah: '${separator}'\n\n`;
            detailedError += `Kolom yang hilang: ${missing.join(', ')}\n\n`;
            detailedError += `Kolom yang ditemukan: ${headers.slice(0, 5).join(', ')}...\n\n`;
            detailedError += `Solusi:\n1. Pastikan file menggunakan Template terbaru.\n2. Coba 'Save As' file Excel menjadi 'CSV (Comma delimited)'.`;

            throw new Error(detailedError);
        }
    }

    const results = [];
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        // Skip empty lines
        if (values.length === 0 || (values.length === 1 && values[0].trim() === '')) continue;

        const obj = {};
        headers.forEach((header, index) => {
            if (header) {
                obj[header] = values[index] ? values[index].trim() : '';
            }
        });
        results.push(obj);
    }

    return results;
}

/**
 * Generates a CSV string and triggers download.
 * @param {string[]} headers 
 * @param {Object[]} data 
 * @param {string} filename 
 */
export function downloadCSV(headers, data, filename) {
    // Add sep=, and UTF-8 BOM for Excel compatibility
    let csvContent = '\uFEFFsep=,\n';
    csvContent += headers.join(',') + '\n';

    data.forEach(row => {
        const rowString = headers.map(h => {
            const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
            // Escape quotes
            let escaped = val.replace(/"/g, '""');
            // Wrap in quotes if contains comma, newline, or quotes
            if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
                escaped = `"${escaped}"`;
            }
            return escaped;
        }).join(',');
        csvContent += rowString + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
