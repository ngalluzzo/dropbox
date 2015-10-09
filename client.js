var client = new Dropbox.Client({ token: 'F9QPpamX2E4AAAAAAAAAFDCFmcgMtY-EzNiRGEpTSYD801XF0tWJZzMxORbhw1pS' });

$(document).ready(function() {
  $('#fileMaker').on('change', function(e) {
    splitFile($(this)[0].files[0])
});

function splitFile(file) {
  var chunkSize = 1024 * 1024; // 1 MB
  var chunks    = Math.ceil(file.size / (1024 * 1024));
  var chunk     = 0;
  var length = Math.min(file.size - (chunk * chunkSize), chunkSize);
  var blob = file.slice(length);
  var offset = chunk * chunkSize;
  //var cursor = false;
  if (chunk < chunks) {
    console.log('file size', file.size);
    console.log('current chunk', chunk + ' of ' + chunks);
    console.log('slice...', file.slice(length));
    client.resumableUploadStep(blob, cursor, splitFile)
    chunk++;
    console.log('just uploaded that', cursor);
  }

}
});

function finishUpload(file, cursor) {
  client.resumableUploadFinish(file.name, cursor, function(err, data) {
    console.log('all done!')
  })
}
