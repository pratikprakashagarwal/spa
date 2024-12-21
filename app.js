import { read, utils, writeFile } from 'xlsx';
let srcNumbersSet = {};

document.getElementById('apiForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const fps_id = document.getElementById('fps_id').value;
    const month = document.getElementById('month').value;
    const year = document.getElementById('year').value;

    const url = '/api/FPS_Trans_Details.jsp';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': 'JSESSIONID=4TLgyidzCpulgKxUZmSMt8xl1blNtjLO3AlFvy46.scm-portal-1',
    };
    
    const body = new URLSearchParams({
        dist_code: '2521',
        fps_id: fps_id,
        month: month,
        year: year,
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body,
        });

        const html = await response.text();
        srcNumbersSet = extractSrcNumbers(html);
        const srcNumbersCount = countSrcNumbers(html);
        console.log(srcNumbersCount);
        const totalOccurrences = calculateTotalOccurrences(srcNumbersCount);

        // <strong>Unique SRC Numbers:</strong> ${[...srcNumbersSet].join(', ')}
        //     <br><br>
        //     <strong>SRC Number Counts:</strong> <br>
        //     ${Object.entries(srcNumbersCount).map(([srcNo, count]) => `${srcNo}: ${count}`).join('<br>')}
        //     <br><br></br>

        document.getElementById('response').innerHTML = `
            
            <strong>Total Occurrences:</strong> ${totalOccurrences}
        `;

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('response').textContent = 'An error occurred';
    }
});

// Handle Excel file upload and filtering
document.getElementById('excelFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        // Filter rows where SRC No is NOT in the HashSet (Filtered-out rows)
        const filteredOutRows = worksheet.filter((row, index) => {
            if (index === 0) return true; // Keep the header row
            const srcNo = row[1]; // Assuming SRC No is in the second column
            return !srcNumbersSet.has(Number(srcNo)); // Keep rows NOT in the HashSet
        });

        // Display the filtered data in a table
        displayFilteredData(filteredOutRows);

        // Rebind download and copy buttons with the new data
        document.getElementById('downloadBtn').onclick = () => downloadFilteredData(filteredOutRows);
        document.getElementById('copyBtn').onclick = () => copyToClipboard(filteredOutRows);
    };

    reader.readAsArrayBuffer(file);
});

// Function to parse the HTML response and extract SRC No
function extractSrcNumbers(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const srcNumbers = new Set();
    const rows = doc.querySelectorAll('#Report tbody tr');

    rows.forEach(row => {
        const srcNo = row.cells[1]?.textContent.trim();
        if (srcNo) {
            srcNumbers.add(Number(srcNo));
        }
    });

    return srcNumbers;
}

// Function to count occurrences of each SRC No
function countSrcNumbers(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const srcNumbersCount = {};
    const rows = doc.querySelectorAll('#Report tbody tr');

    rows.forEach(row => {
        const srcNo = row.cells[1]?.textContent.trim();
        if (srcNo) {
            srcNumbersCount[srcNo] = (srcNumbersCount[srcNo] || 0) + 1;
        }
    });

    return srcNumbersCount;
}

function calculateTotalOccurrences(srcNumbersCount) {
    return Object.values(srcNumbersCount).reduce((total, count) => total + count, 0);
}

function displayFilteredData(rows) {
    const table = document.createElement('table');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
    document.getElementById('filteredData').innerHTML = '';
    document.getElementById('filteredData').appendChild(table);
    document.getElementById('downloadBtn').style.display = 'inline-block';
    document.getElementById('copyBtn').style.display = 'inline-block';
}

function downloadFilteredData(rows) {
    const newWorkbook = utils.book_new();
    const newWorksheet = utils.aoa_to_sheet(rows);
    utils.book_append_sheet(newWorkbook, newWorksheet, 'Filtered Out Rows');
    writeFile(newWorkbook, 'filtered_out_rows.xlsx');
}

function copyToClipboard(rows) {
    const text = rows.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text).then(() => {
        alert('Filtered data copied to clipboard');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}
