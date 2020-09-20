var app = (function(cardDeck, Showdown) {
    "use strict";
    var appAddress = "https://script.google.com/macros/s/AKfycbzR8010DKKawghi360-2dFOqR3xSaOqeSV0QeS1dg/exec";

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
    var apiArray = ["AIzaSyDpE9eFx605MaEFz5b191k2nAX-MPvAeTM",
                    "AIzaSyApW0Fk_Y1R_yH2pTRBhNDUBP8BfWcurDQ"],
        currentApiIndex = 1;

    function getNextApiKey() {
        if (currentApiIndex === apiArray.length) {
            currentApiIndex = 0;
        }
        return apiArray[currentApiIndex++];
    }

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

    function getQueryString(query, startIndex, apiKey) {
        return  "https://content-customsearch.googleapis.com/customsearch/v1?" +
            "cx=04674154ad6f996c2" +
            "&q=" + query +
            "&searchType=image" +
            "&start=1"+ startIndex +
            "&key="+ apiKey;
    }

    function getAllSheets() {
        var address = appAddress + "?getAllSheets='true'";
        $.get(address, function (data) {
            $.each(data.sheets, function(index, value) {
                $('#decksList')
                    .append($("<option></option>")
                        .text(value));
            });
        });
    }

    function getImages(queryString) {
        var promise = $.get(queryString,function (data) {
            imageDeck.images = data.items;
            imagesLength = imageDeck.images.length;
            console.log("Images loaded: "+ imagesLength);
        });
        return promise;
    }

    function loadImages(startIndex) {
        var query = $("#search-string").val();
        if (query === "") {
            query = "views";
        }
        var apiKey = getNextApiKey();
        var pathForPics = getQueryString(query, startIndex, apiKey);
        getImages(pathForPics).fail(function (){
            //free limit is reached
            apiKey = getNextApiKey();
            pathForPics = getQueryString(query, startIndex, apiKey);
            getImages(pathForPics);
        });
    }

    function loadCards() {
        var deck = $("#decksList").val();
        var pathForCards = appAddress +
            "?deck=" + deck;
        //get words
        $.get(pathForCards,function (data) {
            cardDeck.cards = data.cards;
            cardsLength = cardDeck.cards.length;
            cards = cardDeck.cards;
            cards = shuffle(cards);
        });
    }
    return {
        init: function() {
            cardCount = 0;
            startIndex = 1;
            getAllSheets();
            loadCards();
            loadImages(startIndex);
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
                loadImages(startIndex);
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

$(document).delegate("#enter-search-string-page","pagecreate", function () {
    function updateDeck() {
        app.init();
    }
    $("#updateDeck").bind("click", function(event, ui) {
        updateDeck();
    });

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
                $('#question').html(app.markdownToHTML(card.translation));
                $('#answer').html(app.markdownToHTML(card.word));
                $('#type').html(app.markdownToHTML(card.type));
                $('#example').html(app.markdownToHTML(card.example));
                $('#synonym').html(app.markdownToHTML(card.synonym));
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


