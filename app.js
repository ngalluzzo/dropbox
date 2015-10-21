//localStorage.clear()
var client = new Dropbox.Client({ token: 'CuKPLbYrNvEAAAAAAABu1A0dqwSZGDzVXYNMVuWRTLbPevYbFwav4pmFuJD2cn-l' });
var source = $('#card-template').html();
var template = Handlebars.compile(source);

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
  this.cancelled = false;
  this.$el = undefined;
  this.$pause = undefined;
  this.$delete = undefined;
  this.$progress = undefined;
  this.dir = undefined;

  this.uploadFile = function() {
    this.$el = $('li#' + this.name);
    this.$pause = this.$el.find('.card-pause')[0];
    this.$delete = this.$el.find('.card-delete')[0];
    this.$progress = this.$el.find('.progress .determinate')[0];
    this.dir = $('input[name="company"]').val() + '/';
    var self = this;
    var localFile = JSON.parse(localStorage[self.name]);
    var xhrListener = function(dbXhr) {
      dbXhr.xhr.upload.addEventListener("progress", function(event) {
        //upload_progress = Number((event.loaded/event.total) * 100).toFixed(2);
        //$('div#' + self.name + ' .chunk.progress .progress-bar').css('width', upload_progress + '%');
      });

      dbXhr.xhr.upload.addEventListener("loadend", function(event) {
        console.log('load end..',event.total);
        self.progress = Number(((self.chunk/self.chunks)*100).toFixed(2));
        console.log('saving to local...');
        localStorage.setItem(self.name,JSON.stringify(self));
        $(self.$progress).css('width', self.progress + '%');
        $(self.$el).find('.p_progress').text(self.progress + '%');
      });
      return true;
    };

    client.onXhr.addListener(xhrListener);

      function uploadChunk(err,cursor) {
        self.cursor = cursor;
        if(err) {
          console.log('problem.. saving to local',err);
          localStorage.setItem(self.name,JSON.stringify(self));
        }

        if (!self.uploading) {
          console.log('uploading but paused..',self.chunk);
          $(self.$progress).css('width','0');
          localStorage.setItem(self.name,JSON.stringify(self));
          return;
        }

        if (self.chunk < self.chunks && !self.cancelled) {
          console.log('starting chunk',self.chunk, self.chunks);
          self.offset = self.chunk * self.chunkSize;
          var fileChunk = self.file.slice(self.offset,self.offset + self.chunkSize);
          client.resumableUploadStep(fileChunk,self.cursor,uploadChunk);
          self.chunk++;
        }
        else {
          client.resumableUploadFinish(self.dir + self.file.name,cursor,function(err,data) {
            if(err) {
              console.log('finish error..',err);
            }
            console.log('finished upload');
            console.log('removing from localStorage');
            localStorage.removeItem(self.name);
            $('li#' + self.name + ' .p_progress').html('<p>Upload Complete!</p>');
            $('li#' + self.name + ' i.card-pause').removeClass('red').addClass('green').text('done').off();
          })
        }
      }

      uploadChunk(null,self.cursor);
  };

  this.pauseUpload = function(){
    console.log('pressed pause..');
    this.uploading = !this.uploading;
    if (this.uploading) {
      this.uploadFile();
    }
  };

  this.cancelUpload = function() {
    console.log('pressed cancel...');
    this.cancelled = true;
      console.log('upload was cancelled...');
      localStorage.removeItem(this.name);
      delete activeFiles[self.this];
      $('li#' + this.name).remove();
  }
}

var activeFiles = {};

$('.fileDrop').on('submit', function(e) {
    e.preventDefault();
    if ($('input[name="company"]').val() === '') {
      alert('Company name is required, please try again.');
      retrun;
    }
    uploadFile = $('#fileMaker')[0].files[0];
    uploadFile = new fileUpload(uploadFile);
    var localFile = localStorage.getItem(uploadFile.name);
    localFile = JSON.parse(localFile);
    console.log(localFile);
    if (localFile === null) {
      localStorage.setItem(uploadFile.name,JSON.stringify(uploadFile));
      localFile = localStorage.getItem(uploadFile.name);
      localFile = JSON.parse(localFile);
    }
      uploadFile.progress = localFile.progress;
      uploadFile.chunk = localFile.chunk;
      uploadFile.offset = localFile.offset;
      uploadFile.cursor = localFile.cursor;
      activeFiles[uploadFile.name] = uploadFile;
      var html = template(uploadFile);
      $('.collection').append(html);
      uploadFile.uploadFile();
      $('#fileMaker').val('');
  });

  $('.collection').on('click', '.card-pause', function(e) {
    e.preventDefault();
    var thisFile = activeFiles[$(this).parents('li').attr('id')]
    thisFile.pauseUpload()
    if (thisFile.uploading) {
      $(this).text('pause');
    }
    else {
      $(this).text('play_arrow');
    }
  });

  $('.collection').on('click', '.card-delete', function(e) {
    if (confirm('Are you sure you want to cancel this upload?')) {
      e.preventDefault();
      var thisFile = activeFiles[$(this).parents('li').attr('id')]
      activeFiles[thisFile.name].cancelUpload();
      $(this).parents('li').remove();
    }
  });
