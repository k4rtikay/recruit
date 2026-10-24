import { getDocumentProxy } from "unpdf";

async function extractWithCoordinates() {
    const buffer = await fetch(
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    ).then((res) => res.arrayBuffer());

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
}

extractWithCoordinates();
