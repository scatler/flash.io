var app = (function(cardDeck, Showdown) {
    "use strict";

    var appName = 'Flash Cards',
        version = '0.2',
        cardCount = 0,
        imageCount = 0,
        timeToShowPicture = false,
        cards = cardDeck.cards,
        imageDeck = {},
        cardsLength = 1,
        imagesLength = 1,
        startIndex = 1,
        markdownConverter = new Showdown.converter();

    var pathForPics = "https://content-customsearch.googleapis.com/customsearch/v1/siterestrict?" +
        "cx=04674154ad6f996c2" +
        "&q=madison ivy" +
        "&searchType=image" +
        "&start=1"+
        "&key=AIzaSyApW0Fk_Y1R_yH2pTRBhNDUBP8BfWcurDQ";

    function shuffle(array) {
        // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
        var counter = array.length, temp, index;
        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter = counter - 1;

            // And swap the last element with it
            temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }
        return array;
    }

    return {
        init: function() {
            cardCount = 0;
            var pathForCards = "https://script.google.com/macros/s/AKfycbzR8010DKKawghi360-2dFOqR3xSaOqeSV0QeS1dg/exec";
            $.get(pathForCards,function (data) {
                cardDeck.cards = data.cards;
                cardsLength = cardDeck.cards.length;
                cards = cardDeck.cards;
                cards = shuffle(cards);
            });

            $.get(pathForPics,function (data) {
                imageDeck.images = data.items;
                imagesLength = imageDeck.images.length;
                console.log("Images count: "+ imagesLength);
            });
        },
        getNextCard: function() {
            var card;
            if (cardCount !== cardsLength) {
                card = cards[cardCount];
                cardCount = cardCount + 1;
            } else {
                cardCount = 0;
            }
            return card;
        },
        getNextImage: function () {
            var image;
            if (imageCount !== imagesLength) {
                image = imageDeck.images[imageCount++];
            } else {
                startIndex = startIndex + imageCount;
                var pathForPics = "https://content-customsearch.googleapis.com/customsearch/v1/siterestrict?" +
                    "cx=04674154ad6f996c2" +
                    "&q=madison ivy" +
                    "&searchType=image" +
                    "&start="+ startIndex +
                    "&key=AIzaSyApW0Fk_Y1R_yH2pTRBhNDUBP8BfWcurDQ";
                $.get(pathForPics,function (data) {
                    imageDeck.images = data.items;
                    imagesLength = imageDeck.images.length;
                    console.log("Images count: "+ imagesLength);
                });
                imageCount = 0;
                image = imageDeck.images[imageCount++];
            }
            return image;
        },
        timeToShowPicture: function (){
            return timeToShowPicture;
        },
        setTimeToShowPicture: function(itIsTime) {
            timeToShowPicture = itIsTime;
        },
        markdownToHTML: function(markdownText) {
            var text = markdownText.replace(new RegExp('\\|', 'g'), '\n');
            return markdownConverter.makeHtml(text);
        }
    };
})(flashcardDeck, Showdown);

/*
 jQueryMobile event handlers
 */
$(document).bind('pageinit', function(event, ui) {
    "use strict";
    app.init();
    $('#app-title').text(flashcardDeck.word);
    $('#app-catch-phrase').text(flashcardDeck.translation);
});

$(document).delegate("#title-page", "pagecreate", function() {
    "use strict";
    $(this).css('background', '#f0db4f');
    if (navigator.userAgent.match(/Android/i)) {
        window.scrollTo(0, 1);
    }
});

$(document).delegate("#main-page", "pageinit", function() {
    "use strict";
    function nextCard() {
        $('#flash-card').trigger('collapse');
        $('#motivation').hide();
        var card = app.getNextCard();
        var image = app.getNextImage();
        if (card === undefined) {
            window.location.href = '#resources-page';
        } else {
            if (app.timeToShowPicture()) {
                $('#cardsShow').hide();
                $('#motivation').attr('src',image.link);
                $('#motivation').show();
                app.setTimeToShowPicture(false);
            } else {
                $('#cardsShow').show();
                $('#motivation').hide();
                $('#question').html(app.markdownToHTML(card.word));
                $('#answer').html(app.markdownToHTML(card.translation));
                app.setTimeToShowPicture(true);
            }
        }
    }

    $("#next-card").bind("click", function(event, ui) {
        nextCard();
    });
    $("#skip-card").bind("click", function(event, ui) {
        nextCard();
    });
    $("#motivation").bind("click", function(event, ui) {
        nextCard();
    });
    $("#main-page").on("swipeleft", function(event) {
        nextCard();
    });
    $(document).delegate('#main-page', 'pageshow', function() {
        nextCard();
    });
});


