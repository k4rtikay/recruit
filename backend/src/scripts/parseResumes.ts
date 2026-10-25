import { getDocumentProxy } from "unpdf";
import path from "node:path";
import fs from "node:fs/promises";

async function extractWithCoordinates() {
    const filePath = path.join(
        import.meta.dirname,
        "../../storage/resumes/sample-2.pdf",
    );

    try {
        const buffer = await fs.readFile(filePath);

        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        console.log(`Total pages: ${pdf.numPages}`);

        const page = await pdf.getPage(1);
        const content = await page.getTextContent();

        const spatialText = content.items.map((item: any) => ({
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
        }));

        console.log(spatialText);
    } catch (error) {
        console.error("Failed to read the file locally:", error);
    }
}

extractWithCoordinates();
