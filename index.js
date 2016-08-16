function im(){}
im.bser = new ds.BookServer('http://'+location.host+'/books');
// ds.Paginator;
// ds.model.Book;

var app = new dx.App();

// CONFIG
///////////////////////////////////////////
app.config({
  host: 'http://192.168.1.40:8000/',
  bookFolder: 'books',
  homeScreen: 'library',
})

// SCREEN
///////////////////////////////////////////

// library
.screen('library', function(scr){
  vframe = new dx.VertFrame(scr, 12);
  scr.shelf = new ShelfWidget(scr);
  vframe.addBelow(scr.shelf, 11);
  scr.navbar = new NavbarWidget(scr);
  vframe.addBelow(scr.navbar, 1);
  
  scr.pack(vframe);
})

// book
.screen('book', function(scr){
  vframe = new dx.VertFrame(scr, 12);
  scr.panel = new PanelWidget(scr);
  vframe.addBelow(scr.panel, 2)
  scr.page = new PageWidget(scr);
  vframe.addBelow(scr.page, 9);
  scr.navbar = new NavbarWidget(scr);
  vframe.addBelow(scr.navbar, 1);

  scr.pack(vframe);

  scr.alertBox = new dx.AlertBox(scr);
  scr.dictionaryModal = new DictionaryModal(scr);
  scr.bookmarkModal = new BookmarkModal(scr);
  scr.highlightModal = new HighlightModal(scr);
})

// RUN APP
/////////////////////////////////////////////
app.run();

// WIDGET
////////////////////////////////////////////
function ShelfWidget(scr){
  dx.Widget.apply(this, arguments);

  var widCss = {
    'overflow': 'scroll',
    'background': '#eee',
  }

  var bookBoxCss = {
    'width': '90vmin',
    'margin': '4vmin auto 0',
    'text-align': 'left',
  }

  var bookCss = {
    'border': '1px solid gray',
    'box-shadow': '0 0 5px #aaa',
    'box-sizing': 'border-box',
    'background': '#0ee',
    'height': '43vmin',
    'width': '28vmin',
    'margin': '1vmin',
    'padding': '10px',
    'text-align': 'center',
    'float': 'left',
  }

  this.initialize = function() {
    this.superInitialize();
    this.$wid.css(widCss);
    this.$wid.allowScrollingY();

    // add books
    var $bookBox = $('<div id="book-box">');
    $bookBox.css(bookBoxCss);
    this.$wid.empty();
    this.$wid.append($bookBox);
    im.bser.loadBookFilenames( function(filename) {
      // each filename
      var $book = $('<div class="book">');
      $book.css(bookCss);
      $book.text(filename);
      $book.hammer().on('tap', function(){
        app.gotoScreen('book', {filename});
      });
      $bookBox.append($book);
    });
  }
}

function NavbarWidget(scr) {
  dx.Widget.apply(this, arguments);

  var widCss = {
    'padding': '10px',
    'background': '#bbb',
  };
  
  this.initialize = function() {
    this.superInitialize();
    this.$wid.css(widCss);
    this.$wid.empty();

    var $homeBtn = $('<div>');
    $homeBtn.text('goHome');
    $homeBtn.click(app.gotoHomeScreen);
    this.$wid.append($homeBtn);
    
  }
}

function PanelWidget(scr){
  dx.Widget.apply(this, arguments);
  var wid = this;

  var widCss = {
    'background': '#eee',
    'padding': '5px',
  };
  
  wid.initialize = function(){
    wid.superInitialize();
    wid.$wid.css(widCss);
    wid.$wid.allowScrollingY();
    wid.$wid.empty();
  }
  wid.addTitle = function(titleStr){
    $h1 = $('<h1>');
    $h1.text(titleStr);
    wid.$wid.append($h1);
  }
  wid.addContent = function(contentStr){
    $p = $('<p>');
    $p.text(contentStr);
    wid.$wid.append($p);
  }
  wid.showDefinition = function showDefinition (wordStr) {
    wid.$wid.empty();
    wid.addTitle(wordStr);
  }
  wid.highlightText = function highlightText (wordStr) {
    wid.$wid.empty();
    wid.addContent('highlight'+wordStr);
  }
}

function PageWidget(scr) {
  dx.Widget.apply(this, arguments);
  var wid = this;
  var paginator = new ds.Paginator();
  var bookCtrl = new ds.ctrl.Book();

  var widCss = {
    'padding': '10px',
  };

  var pageCss = {
    'font-size': '2.5em',
    'height': '100%',
  };

  wid.initialize = function(opt){
    wid.superInitialize();
    wid.$wid.empty();
    wid.$wid.css(widCss);
    wid.$wid.allowScrollingY();
    
    var $page = $('<div>');
    $page.css(pageCss);
    wid.$wid.append($page);
    
    im.bser.loadBookText(opt.filename, function(bookText){
      book = new ds.model.Book(opt.filename, bookText);
      paginator.setContainer($page);
      paginator.paginate(book);
      bookCtrl.setBook(book);
      bookCtrl.setPageContainer($page);

      bookCtrl.wordOn('tap').defineWord(scr.panel);
      bookCtrl.showPage(1);
      // bookCtrl.wordOn('doubletap').highlightText(scr.panel);

      bookCtrl.pageOn('swipeleft').nextPage();
      bookCtrl.pageOn('swiperight').prevPage();
    });
  }
}

function DictionaryModal(scr){
  dx.Modal.apply(this, arguments);
}

function BookmarkModal(scr) {
  dx.Modal.apply(this, arguments);
}

function HighlightModal(scr) {
  dx.Modal.apply(this, arguments);
}

