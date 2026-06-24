var MAX_DIM = 300;

export function generateThumbnail(blobUrl) {
  return new Promise(function (resolve) {
    var img = new Image();
    img.onload = function () {
      var dims = calcDimensions(img.width, img.height);
      var canvas = document.createElement('canvas');
      canvas.width = dims.width;
      canvas.height = dims.height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, dims.width, dims.height);
      canvas.toBlob(function (blob) {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(blobUrl);
        }
      }, 'image/jpeg', 0.7);
    };
    img.onerror = function () { resolve(blobUrl); };
    img.src = blobUrl;
  });
}

function calcDimensions(w, h) {
  if (w <= MAX_DIM && h <= MAX_DIM) return { width: w, height: h };
  var ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}
