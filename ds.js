function ds() {}

/* LocalStorage
*****************************************/
ds.LocalStorage = function() {
  this.save = function (item_key, item) {
    localStorage.setItem(item_key, JSON.stringify(item));
  };
  this.load = function (item_key){
    return JSON.parse(localStorage.getItem(item_key));
  };
  this.exist = function(item_key) {
    return this.load(item_key) != null;
  };
  this.clear = function() {
    localStorage.clear();
  }
};


/* Paginator
*****************************************/
ds.Paginator = function(){
  this.$container = {};
  
  this.setContainer = function($el) {
    this.$container = $el;
    console.debug("desc|this.$container.outerHeight():", this.$container.outerHeight());
  }
  
  this.paginate = this.repaginate = function(book) {
    var pages = [];
    var words = book.text.trim().replace(/\n/g, ' ').split(' ');
    var $newPage = $('<div>');
    var oldText = null;
    var extraWord = '';
    this.$container.append($newPage);

    // Loop through each word in text
    for(var i = 0; i < words.length; i++) { 
      var newPageText;
      if(oldText) { // If not a new page
        newPageText = oldText + ' ' + words[i];
      } else if(extraWord){
        newPageText = extraWord + ' ' + words[i];
      } else {       // If it is a new page
        newPageText = words[i];
      }
      $newPage.text(newPageText); // Update widget with new text
      // If current page exceeds viewport height
      if($newPage.height() > this.$container.outerHeight() ) {
        // Append page from previous loop to pages
        //  PageCtrl.addPage(oldText);
        pages.push(oldText);
        // Update widget with old text (from previous loop)
        $newPage.text(oldText);
        // $newPage.clone().insertBefore($newPage);
        oldText = null;
        extraWord = words[i];
      } else { // If current page still has space
        oldText = newPageText;             
      }
    }    
    if (oldText) pages.push(oldText); // append last page to pages
    else pages.push(extraWord);       // append last word to pages

    book.pages = pages;
    this.$container.empty();
  }
}


/* FileServer
*****************************************/
ds.FileServer = function(){
  this.loadFilenames = function(folder_url, selector, cb){
    $.ajax({
      url: folder_url,
      success: function(data){
        $(data).find(selector).each(function(){
          cb($(this).text());
        });
      },
    });
  };
  this.loadFile = function(file_url, cb){
    $.ajax({
      url: file_url,
      success: function(data){
        cb(data);
      }
    });
  }
};


/* BookServer
*****************************************/
ds.BookServer = function (book_folder_url){
  console.debug("desc|init bookserver:");
  this.folder_url = book_folder_url.endsWith('/')? book_folder_url : book_folder_url + '/';
  this.fileServer = new ds.FileServer(); // Dependency

  this.loadBookFilenames = function(cb){
    this.fileServer.loadFilenames(this.folder_url, "a:contains('.txt')", function(each_filename){
      cb(each_filename);
    });
  };

  this.loadBookText = function(filename, cb) {
    this.fileServer.loadFile(this.folder_url +filename, function(file_content){
      cb(file_content);
    });
  }
}

ds.Dictionary = function() {
  var api_key = "?key="+"8d3c1550-6d45-4b66-adb9-c6772066a68c";
  var website = "http://www.dictionaryapi.com/api/v1/references/collegiate/xml/";

  this.createEntryList = function(data_xml) {
    console.debug("DATA", data_xml);
    var entry_list = [];
    $(data_xml).find('entry').each(function(i, entry){
      var entry_word = $(entry).find('ew').text();
      var func_label = $(entry).find('fl').first().text();
      var def_list = [];
      $(entry).find('def').find('dt').each(function(i, def) {
        def_list.push($(def).text().replace(':',''));
      });
      entry_list.push({
        ew: entry_word,
        fl: func_label,
        defs: def_list,
      });
    });
    return entry_list;
  }

  var that = this;
  this.defineWord = function(word, callback) {
    $.ajax({
      type: "GET",
      url: website + word + api_key,
      success: function(data_xml) {
        entry_list = that.createEntryList(data_xml);
        console.debug("entry_list", entry_list);
        callback(entry_list);
      }
    }); 
  }
}

ds.Highlighter = function(){

}

// requires hammer.js, jquery.hammer.js
ds.Eventor = function(){
  var events = [];
  var $target = null;

  this.setTarget = function($tgt) {
    $target = $tgt;
  }

  this.addEvent = function(ev, hdlr) {
    events.push({ev, hdlr});
  }

  this.bind = function() {
    for (var i = 0, l = events.length; i < l; i++) {
      var evt = events[i];
      $target.hammer().on(evt.ev, evt.hdlr);
    }
  }
}

//////////////////////////////////////////
// MODEL
//////////////////////////////////////////
ds.model = function(){}

/* Book
*****************************************/
ds.model.Book = function(filename, text) {
  console.debug("desc|this:", this);
  this.bookTitle = filename.replace(".txt", "");
  this.viewportSize = {x: $(window).outerWidth(), y: $(window).outerHeight()};
  this.text = text;
  this.pages = []; 
  this.paperclip = 1;

  this.getPageText = function(page_num) {
    return this.pages[page_num -1];
  };

  this.repositionPaperclip = function(old_num_of_pages) {
    var old_num_of_pages = old_num_of_pages;
    var new_num_of_pages = this.pages.length;
    var old_paperclip = this.paperclip;

    var progress = old_paperclip / old_num_of_pages;
    var new_paperclip = Math.floor(progress * new_num_of_pages);

    this.paperclip = new_paperclip; 
  };
}

//////////////////////////////////////////
// CONTROLLER
//////////////////////////////////////////
ds.ctrl = function(){}

ds.ctrl.Dictionary = function(){
  var dictionary = new ds.Dictionary();

  // find in Dictionary and update to $target widget
  this.showDefinition = function(word, $target) {
    $target.empty();
    $target.html('Looking for <b>'+word+'</b> in dictionary...');
    dictionary.defineWord(word, function(entryList){
      $target.empty();
      if(entryList.length){
        for (var i = 0, l = entryList.length; i < l; i++) {
          var entry = entryList[i];
          var $ew = $('<b>');
          $ew.text(entry.ew);
          var $fl = $('<em>');
          $fl.text(entry.fl);
          $target.append([$ew,' ', $fl]);
          for (var j = 0, k = entry.defs.length; j < k; j++) {
            var def = entry.defs[j];
            var $def = $('<span>');
            $def.text(def);
            $target.append(['<br>: ', $def, '<br>']);
          }
          $target.append('<br>');
        }
      }
      else {
        $target.append('Sorry :)<br><b>'+word+'</b> is not found in dictionary.')
      }
    });
  }
}
/* Book
*****************************************/
ds.ctrl.Book = function(){
  var dictionaryCtrl = new ds.ctrl.Dictionary();
  var highlighter = new ds.Highlighter();
  var wordEventor = new ds.Eventor();

  var self = this;
  var curWordEv = '';
  var curPageEv = '';
  var $page = {};
  self.book = {};
  self.wordEvents = [];

  self.setBook = function(book) {
    self.book = book;
  }

  self.setPageContainer = function($pageContainer) {
    $page = $pageContainer;
  }

  self.showPage = function(pageNum) {
    var pageText = self.book.getPageText(pageNum);
    var words = pageText.split(' ');
    self.book.paperclip = pageNum;

    $page.empty();
    // word.each
    for (var i = 0, l = words.length; i < l; i++) {
      var word = words[i];
      var $word = $('<span class="word">'+ word + '</span>');
      $page.append($word);
      $page.append(' ');
    }
    wordEventor.setTarget($('.word'));
    wordEventor.bind();
  }
  self.wordOn = function(ev) {
    curWordEv = ev;
    return self;
  }
  self.pageOn = function(ev) {
    curPageEv = ev;
    return self;
  }
  self.wordBind = function(ev, evHandler) {
    $('.word').hammer().on(ev, function(e) {
      evHandler(e.target.innerHTML.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""));
    });
  }
  
  // Word Event Handlers
  self.defineWord = function(targetObj) {
    wordEventor.addEvent(curWordEv, function(e){
      var $target = targetObj.$wid;
      var word = e.target.innerHTML.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      
      // find in Dictionary and update to $target widget
      dictionaryCtrl.showDefinition(word, $target);
    });
  }

  // Page Event Handlers
  self.nextPage = function() {
    $page.hammer().on(curPageEv, nextPage);
  }
  self.prevPage = function() {
    $page.hammer().on(curPageEv, prevPage);
  }

  // Private Functions
  var nextPage = function() {
    if(self.book.paperclip < self.book.pages.length)
      self.showPage(self.book.paperclip + 1);
  }
  var prevPage = function() {
    if(self.book.paperclip > 1)
    self.showPage(self.book.paperclip - 1);
  }
}

