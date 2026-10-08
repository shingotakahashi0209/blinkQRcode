/////////////////////////////////////////////////
///This program is to generate QR code for     //
// blink bike share                            //
//initially, you will have to do 
//  npm install pdfkit 
//  npm install -g qrcode
/////////////////////////////////////////////////

const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require("fs");

// ========================================
// Generate QR code
// ========================================
async function generateQRCode(lock_id, filename) {
    await QRCode.toFile(
        filename,
        String(lock_id),
        {
            margin: 1,
            width: 500
        }
    );
}

// ========================================
// Create Landscape QR PDF
// ========================================
async function createLandscapeQRPDF(
    lockIDs,
    outputPdfName = `qr_landscape_${lockIDs[0]}_${lockIDs[lockIDs.length - 1]}.pdf`
) {
     const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0
    });
    const output = fs.createWriteStream(outputPdfName);
    doc.pipe(output);

    // ========================================
    // Register Japanese font
    // ========================================
    doc.registerFont("IPAGothic", "ipaexg.ttf");

    // ========================================
    // A4 landscape dimensions
    // ========================================
    const PAGE_WIDTH = 841.89;
    const PAGE_HEIGHT = 595.28;
    const cols = 6;
    const rows = 3;
    const marginX = 42;
    const marginY = 42;
    const spacingX = 22.4;
    const spacingY = 22.4;

    // ========================================
    // Calculate cell dimensions
    // ========================================
    const cellWidth =
        (PAGE_WIDTH -
            2 * marginX -
            (cols - 1) * spacingX) / cols;
    const cellHeight =
        (PAGE_HEIGHT -
            2 * marginY -
            (rows - 1) * spacingY) / rows;

    // ========================================
    // QR code size
    // ========================================
    const qrSize = cellWidth * (2 / 3);


    // ====================================================
    // Calculate number of pages. Each page contains cols=6
    // ====================================================
    const numPages = Math.ceil( lockIDs.length / cols);

    //console.log(`Total IDs: ${lockIDs.length}`);
    //console.log(`Total pages: ${numPages}`);

    // ========================================
    // ページごとにQRコードを作成する、一つのページにはcols＝６個のIDを置く
    //一つのIDに付き、３つ縦に同じQRを並べる
    // ========================================
    for (let pageStart = 0; 
             pageStart < lockIDs.length; 
             pageStart += cols
    ) {

        // ----------------------------------------
        // 始める場所が０でない場合は、ページを付け加える
        // ----------------------------------------
        if (pageStart > 0) {
            doc.addPage({
                size: "A4",
                layout: "landscape",
                margin: 0
            });
        }

        // ----------------------------------------
        // ページごとに、lockIDsをスライスする
        // ----------------------------------------
        const slicedLockIDs = lockIDs.slice(
            pageStart, pageStart + cols
        );
        //現在のページとそのIDをコンソルに表示して年のため確認
        //console.log(`Page ${Math.floor(pageStart / cols) + 1}:`,  slicedLockIDs);

        // ==============================================
        // Generate QR codes スライスしたLockIDをもとに行う
        // ==============================================
        const qrFiles = [];

        for (let j = 0; j < slicedLockIDs.length; j++) {
            const qrfile =`qr_${slicedLockIDs[j]}.png`;

            await generateQRCode(
                slicedLockIDs[j],
                qrfile
            );

            qrFiles.push(qrfile);
        }

        // ========================================
        // Draw QR codes
        // ========================================
        for (let j = 0; j < slicedLockIDs.length; j++) {

            // One column for each ID
            for (let i = 0; i < rows; i++) {

                // ========================================
                // Cell position
                // ========================================
                const x =
                    marginX +
                    j * (cellWidth + spacingX);

                const y =
                    PAGE_HEIGHT -
                    marginY -
                    (i + 1) * cellHeight -
                    i * spacingY;

                const centerX =
                    x + cellWidth / 2;

                // ========================================
                // Border
                // ========================================
                doc
                    .lineWidth(0.5)
                    .strokeColor("#000000")
                    .rect(
                        x,
                        y + 40,
                        cellWidth,
                        cellHeight - 35
                    )
                    .stroke();

                // ========================================
                // English text
                // ========================================
                doc
                    .font("Helvetica")
                    .fontSize(10)
                    .fillColor("#000000")
                    .text(
                        "Scan to unlock",
                        x,
                        y + 45,
                        {
                            width: cellWidth,
                            align: "center"
                        }
                    );

                // ========================================
                // Japanese text
                // ========================================
                doc
                    .font("IPAGothic")
                    .fontSize(10)
                    .text(
                        "スキャンして解錠",
                        x,
                        y + 55,
                        {
                            width: cellWidth,
                            align: "center"
                        }
                    );

                // ========================================
                // QR codeを置く、場所が、IDが変わるごとに右に移動
                // ========================================
                //まず、ロケーション（X、Y）を設定
                const qrY = y + 68;
                const qrX = centerX - qrSize / 2;
                doc.image(qrFiles[j], qrX, qrY, {width: qrSize, height: qrSize});

                // ========================================
                // QRコードを実際に置く
                // ========================================
                doc
                    .font("Helvetica-Bold")
                    .fontSize(12)
                    .fillColor("#000000")
                    .text(
                        `ID: ${slicedLockIDs[j]}`,
                        x,
                        y + cellHeight - 10,
                        {
                            width: cellWidth,
                            align: "center"
                        }
                    );
            }
        }

        // ========================================
        // Delete temporary QR files
        // ========================================
        for (const file of qrFiles) {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        }
    }

    // ========================================
    // Finish PDF
    // ========================================
    doc.end();

    await new Promise((resolve, reject) => {
        output.on("finish", resolve);
        output.on("error", reject);
    });

    console.log( `Created: ${outputPdfName}`);
}

// ========================================
// 作成するロックIDをここで設定する
// ========================================


  // 連番の場合はこちらを使う
  /*
  const lockIDs =[];
  const startlock=3559;
  const endlock = 3571;

  let start_end_diff = endlock- startlock+1;
  let templock = startlock; 
  console.log('start end diff=', start_end_diff);
     for (let j = 0; j < start_end_diff; j++){
          lockIDs[j]=templock
          templock=templock+1;
  }
*/
  //個別に番号を入力する場合はこちらを使う
  
  const lockIDs = [
 3472,
3473,
3474,
3475,
3476,
3477,
3478,
3479,
3480	
];

//console.log("lockIDs =", lockIDs);

// ========================================
// Create PDF
// ========================================
createLandscapeQRPDF(lockIDs)
    .catch(console.error);

