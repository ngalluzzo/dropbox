var client = new Dropbox.Client({ token: 'F9QPpamX2E4AAAAAAAAAFDCFmcgMtY-EzNiRGEpTSYD801XF0tWJZzMxORbhw1pS' });

var fileUpload = function(file) {
  this.chunkSize = 1024 * 1024;
  this.uploading = true;
  this.file = file;
  this.name = file.name.replace(/\W/g, '_');
  this.cursor = false;
  this.chunk = 0;
  this.chunks = Math.ceil(file.size/this.chunkSize, this.chunkSize);
  this.offset = 0;
  this.progress = 0;

  this.uploadFile = function() {
    var self = this;
    var xhrListener = function(dbXhr) {
      dbXhr.xhr.upload.addEventListener("progress", function(event) {
        upload_progress = Number((event.loaded/event.total) * 100).toFixed(2);
        $('div#' + self.name + ' .chunk.progress .progress-bar').css('width', upload_progress + '%');
      });

      dbXhr.xhr.upload.addEventListener("loadend", function(event) {
        console.log('load end..');
        self.progress = Number(((self.chunk/self.chunks)*100).toFixed(2));
        console.log(self.progress);
        $('div#' + self.name + ' .main.progress .progress-bar').css('width', self.progress + '%');
        $('div#' + self.name + ' .main.progress .progress-bar span').text(self.progress + '%');
      });
      return true;
    };
    client.onXhr.addListener(xhrListener);

      function uploadChunk(err,cursor) {
        self.cursor = cursor;
        if(err) {
          console.log('problem..',err);
        }

        if (!self.uploading) {
          console.log('uploading but paused..',self.chunk);
          $('div#' + self.name + ' .chunk.progress .progress-bar').css('width','0');

          return;
        }

        if (self.chunk < self.chunks) {
          console.log('starting chunk',self.chunk, self.chunks);
          self.offset = self.chunk * self.chunkSize;

          var fileChunk = self.file.slice(self.offset,self.offset + self.chunkSize);
          client.resumableUploadStep(fileChunk,self.cursor,uploadChunk);
          self.chunk++;
        }
        else {
          client.resumableUploadFinish(self.file.name,cursor,function(err,data) {
            if(err) {
              console.log('finish error..',err);
            }
            console.log('finished upload');
            console.log(data);
            $('div#' + self.name + ' .main.progress .progress-bar span').text('Upload Complete!');
            $('div#' + self.name + ' .card-controls').remove();
          })
        }
      }
      uploadChunk(null,this.cursor);
  };

  this.pauseUpload = function(){
    console.log('pressed pause..');
    this.uploading = !this.uploading
    if (this.uploading) {
      this.uploadFile();
    }
  };

  this.cancelUpload = function(){

  }
}

var activeFiles = [];

$('.fileDrop').on('submit', function(e) {
    e.preventDefault();
    uploadFile = $('#fileMaker')[0].files[0];
    uploadFile = new fileUpload(uploadFile);
    activeFiles.push(uploadFile);
    addCard(uploadFile);
    uploadFile.uploadFile();
    $('#fileMaker').val('');
  });

  $('.cards').on('click', '.card-pause', function(e) {
    e.preventDefault();
    console.log('clicked pause...');
    var thisFile = $(this).parent().parent().data();
    var uploadFile = activeFiles.filter(function(file) {
      return file.name === thisFile.name;
    })[0];
    uploadFile.pauseUpload();
    if(!uploadFile.uploading) {
      $(this).removeClass('disabled');
    }
    else {
      $(this).addClass('disabled');
    }
  });

function addCard(file) {
    $('<div class="card" id=' + file.name + '><h4 class="card-title">' + file.file.name + '</h4><div class="card-progress"><div class="main progress"><div class="progress-bar" role="progressbar" aria-valuenow="2" aria-valuemin="0" aria-valuemax="100" style="min-width: 2em; width:' + file.progress + '%;"><span></span></div></div><div class="chunk progress"><div class="progress-bar progress-bar-warning" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div></div></div><div class="card-controls"><span class="card-play glyphicon glyphicon-play" aria-hidden="true"></span><span class="card-delete glyphicon glyphicon-remove-circle" aria-hidden="true"></span></div></div>').appendTo('.cards');
    $('div#' + file.name).data(file);
}
