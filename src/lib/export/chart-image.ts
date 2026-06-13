"use client";

function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function imageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not render chart image for PNG export."));
    image.src = url;
  });
}

export async function downloadChartElementAsPng(elementId: string, filename: string) {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Chart target "${elementId}" was not found.`);
  }

  const svg = element.querySelector("svg");

  if (!svg) {
    throw new Error("PNG export currently supports visible SVG charts such as Recharts charts.");
  }

  const rect = svg.getBoundingClientRect();
  const width = Math.max(Math.ceil(rect.width), 640);
  const height = Math.max(Math.ceil(rect.height), 360);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("viewBox", clone.getAttribute("viewBox") || `0 0 ${width} ${height}`);
  clone.setAttribute("style", `${clone.getAttribute("style") ?? ""};background:#06111f;`);

  const serialized = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await imageFromUrl(svgUrl);
    const pixelRatio = Math.max(window.devicePixelRatio || 1, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not create a canvas context for PNG export.");
    }

    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = "#06111f";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    triggerDownload(canvas.toDataURL("image/png"), filename);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
