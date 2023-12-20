$(function () {
  var pool = [];
  var currentRack = [];
  var board = [];
  var remaining;
  var missingHandTiles;
  var currentTileID = 0
  var doubleCount = 0;
  var currentScore = 0;
  var total = 0;
  var word = "";

  // Get json file of pieces
  $.get("https://ykanane.github.io/Scrabble/pieces.json")
    .done(function (response) {
      tileJSON = response.pieces;
      commence();
    });

  $("#innerRack").droppable({
    tolerance: "fit"
  })

  // Make board accept tile drops
  $("#tileBoard div").droppable({
    tolerance: "pointer",
    drop: tilePlaced,
    out: tileRemoved
  })

  // Start the game by using the setup functions
  function commence() {
    console.log("Initializing game v1.34...");
    makePool();
    makeRack();
    makeTiles(true);
  }

  // Create tile pool
  function makePool() {
    for (i = 0; i < 27; i++) {
      var currentTile = tileJSON[i];
      for (k = 0; k < currentTile.amount; k++) {
        pool.push(currentTile);
      }
    }
  }

  // Create player's rack
  function makeRack() {
    remaining = (pool.length < 7) ? pool.length : 7;
    if (remaining == 0) {
      alert("Not enough remaining tiles to fill your deck");
      return;
    }
    for (i = 0; i < remaining; i++) {
      var rand = Math.trunc(Math.random() * pool.length);
      currentRack.push(pool[rand]);
      pool.splice(rand, 1);
    }
    $("#tiles-remaining").text("Remaining Tiles in Pool: " + pool.length + "/100")
  }

  // Score 
  function scoreWord() {
    console.log("Word: '" + word + "' : ");


    var $total = $("#total-score");
    var newScore = parseInt($total.attr("currentscore")) + currentScore;
    $total.attr("currentscore", newScore);
    $total.text("Compiled Score: " + newScore);


    word = "";
  }

  // Bounce tiles back to rack if not placed on valid space
  function revertTile(event, ui) {
    $(this).data("ui-draggable").originalPosition = {
      top: 0,
      left: 0
    };
    return !event;
  }

  // Subtract points from current word if tile is removed from board
  function subtractPoints($letterTile, $boardTile) {
    var $currScore = $("#score");

    var usedOneCount = 0;

    // Iterate through each element in tileBoard
    $("#tileBoard div").each(function (index, element) {
      var usedValue = $(element).attr("used");

      // Check if eligible is not 0
      if (usedValue == "1") {
        usedOneCount++;
      }
    });
    if (usedOneCount == 6) {
      currentScore -= 50;
    }
    if ($boardTile.attr("class") == "doubleWord ui-droppable ui-droppable-active") {

      currentScore /= 2;

      doubleCount--;
    }
    var letterScore = $letterTile.attr("points") * $boardTile.attr("multiplier");
    currentScore -= letterScore * Math.pow(2, doubleCount);
    $currScore.text("In-Progress Word Score: " + "+" + currentScore);


  }

  // Append word score as tiles are added
  function addPoints($letterTile, $boardTile) {
    var $currScore = $("#score");
    if ($boardTile.attr("class") == "doubleWord ui-droppable") {

      currentScore *= 2;

      doubleCount++;
      currentScore += ($letterTile.attr("points") * $boardTile.attr("multiplier")) * Math.pow(2, doubleCount);
    }
    else {
      var letterScore = $letterTile.attr("points") * $boardTile.attr("multiplier");
      currentScore += letterScore * Math.pow(2, doubleCount);
    }

    var allUsedOne = true;

    // Iterate through each element in tileBoard
    $("#tileBoard div").each(function (index, element) {
      var usedValue = $(element).attr("used");

      if (usedValue !== "1") {
        allUsedOne = false;
        return false;
      }
    });
    if (allUsedOne) {
      currentScore += 50;
    }
    $currScore.text("In-Progress Word Score: " + "+" + currentScore);
  }

  // Update score when a tile is removed from the board
  function tileRemoved(event, ui) {

    var $this = $(this);
    var draggableId = ui.draggable.attr("id");
    var droppableId = $(this).attr("id");
    var $currScore = $("#score");

    console.log(board);

    if (board.includes(ui.draggable.attr("id"))) {
      var boardIndex = board.indexOf(ui.draggable.attr('id'));
      board.splice(boardIndex, 1);
      console.log(board + " inside tileRemoved");
      $(this).attr("used", 0);
      $(this).attr("letter", -1);

      subtractPoints(ui.draggable, $(this));
      update();
    }
  }


  function tilePlaced(event, ui) {
    var $this = $(this);
    var draggableId = ui.draggable.attr("id");
    var draggableLetter = ui.draggable.attr("letter");
    var currentWord = "";
    var droppableId = $(this).attr("id");
    var $currScore = $("#score");
    console.log('Dropped letter ' + draggableLetter + ' with ID: ' + draggableId + ' onto ' + droppableId);



    if (!board.includes(ui.draggable.attr("id"))) {
      if (board.length == 0) {
      }
      else if ($(this).attr("used") == 1 || $(this).attr("eligible") == 0) {
        ui.draggable.draggable('option', 'revert', revertTile);
        ui.draggable.animate(ui.draggable.data().origPosition = {
          top: 0,
          left: 0
        }, "slow");
        return;
      }
      if (ui.draggable.attr("letter") == "Blank") {
        blankPlaced(ui.draggable, $(this));
      }
      else {
        $(this).attr("letter", draggableLetter);
      }
      board.push(ui.draggable.attr("id"));
      $(this).attr("used", 1);
      addPoints(ui.draggable, $(this));
    }
    update();


    ui.draggable.position({
      my: "center",
      at: "center",
      of: $this,
      using: function (pos) {
        $(this).animate(pos, 200, "linear");
      }
    });
  }

  // Append characters to the current word as they are placed, also adjusts eligible attributes
  function update() {
    var currentWord = "";
    $("#tileBoard div").each(function (index, $el) {
      if ($el.getAttribute("letter") != -1) {
        currentWord += $el.getAttribute("letter");
      }
    });
    $("#current-word").text("In-Progress Word: " + currentWord);
    word = currentWord.toLowerCase();

    // Set eligible attribute to 0 for all elements with class boardTile or doubleWord
    $(".boardTile, .doubleWord").attr("eligible", 0);


    //Multiple if statements that changes eligibility attributes based on whether the tiles adjacent are occupoed
    if (document.getElementById("slot-1").getAttribute("used") == 1) {
      document.getElementById("slot-2").setAttribute("eligible", 1);
    }
    if (document.getElementById("slot-2").getAttribute("used") == 1) {
      document.getElementById("slot-1").setAttribute("eligible", 1);
      document.getElementById("slot-3").setAttribute("eligible", 1);
    }
    if (document.getElementById("slot-3").getAttribute("used") == 1) {
      document.getElementById("slot-2").setAttribute("eligible", 1);
      document.getElementById("slot-4").setAttribute("eligible", 1);
    }
    if (document.getElementById("slot-4").getAttribute("used") == 1) {
      document.getElementById("slot-3").setAttribute("eligible", 1);
      document.getElementById("slot-5").setAttribute("eligible", 1);
    }
    if (document.getElementById("slot-5").getAttribute("used") == 1) {
      document.getElementById("slot-6").setAttribute("eligible", 1);
      document.getElementById("slot-4").setAttribute("eligible", 1);
    }
    if (document.getElementById("slot-6").getAttribute("used") == 1) {
      document.getElementById("slot-5").setAttribute("eligible", 1);
      document.getElementById("slot-7").setAttribute("eligible", 1);
    }
    if (document.getElementById("slot-7").getAttribute("used") == 1) {
      document.getElementById("slot-6").setAttribute("eligible", 1);
    }
    document.querySelector('#tileBoard').childNodes.forEach(function (element) {
    });

  }

  // Fill rack up to 7 tiles after each submission, if possible
  function fillRackForNextHand() {
    if (word == "")
    {
      if (pool.length == 0 && currentRack.length == 0)
      {
        alert("There are no more tiles in your rack or the deck");
      }
      return;
    }
   

    if (currentRack.length < 7) {
      missingHandTiles = 7 - currentRack.length;
      if (pool.length < missingHandTiles && currentRack.length !== 0) {
        alert("Not enough remaining tiles to fill your deck");
        pool = [];
        $("#tiles-remaining").text("Remaining Tiles in Pool: " + pool.length + "/100")
        return;
      }
      else {
        for (i = 0; i < missingHandTiles; i++) {
          var rand = Math.trunc(Math.random() * pool.length);
          currentRack.push(pool[rand]);
          pool.splice(rand, 1);
        }
      }
      $("#tiles-remaining").text("Remaining Tiles in Pool: " + pool.length + "/100")
      makeTiles(false);
    }
    else {
      console.log("Rack full");
    }
  }

  // "Create" new tiles when needed
  function makeTiles(resetFlag) {
    if (resetFlag) {
      for (i = 0; i < currentRack.length; i++) {
        var newTileImage = document.createElement("img");
        newTileImage.setAttribute('src', "images/Scrabble_Tile_" + currentRack[i].letter + ".jpg");
        newTileImage.setAttribute('points', currentRack[i].value);
        newTileImage.setAttribute('id', "tile" + currentTileID++);
        newTileImage.setAttribute("index", i);
        newTileImage.setAttribute("letter", currentRack[i].letter);
        newTileImage.classList.add("ui-widget-content");
        $("#innerRack").append(newTileImage);
      }
    }
    else {
      for (i = currentRack.length - missingHandTiles; i < 7; i++) {
        var newTileImage = document.createElement("img");
        newTileImage.setAttribute('src', "images/Scrabble_Tile_" + currentRack[i].letter + ".jpg");
        newTileImage.setAttribute('points', currentRack[i].value);
        newTileImage.setAttribute('id', "tile" + currentTileID++);
        newTileImage.setAttribute("index", i);
        newTileImage.setAttribute("letter", currentRack[i].letter);
        newTileImage.classList.add("ui-widget-content");
        $("#innerRack").append(newTileImage);
      }
    }

    $("#innerRack img").draggable({
      revert: revertTile,
      snap: ".ui-droppable",
      refreshPositions: true,
      snapTolerance: "3",
      snapMode: "both",
      stack: ".ui-draggable",
      stop: function () {
        $(this).draggable('option', 'revert', revertTile);
      }
    }).css({
      width: "75px",
      height: "75px",
      marginBottom: "20px"
    }).droppable({
      greedy: true,
      tolerance: 'pointer',
      drop: function (event, ui) {
        ui.draggable.animate(ui.draggable.data().origPosition = { top: 0, left: 0 }, "slow");
      }
    });
  }

  // Have user pick the letter used for a blank tile
  function blankPlaced(blankTile, boardTile) {
    var tileDialog = $('<div></div>');
    tileDialog.attr('id', 'tileDialog');
    tileDialog.attr('title', 'Click on a letter.')
    tileJSON.forEach(element => {
      if (element.letter != 'Blank') {
        var tileInDialog = document.createElement("img");
        tileInDialog.setAttribute('src', "images/Scrabble_Tile_" + element.letter + ".jpg");
        tileInDialog.setAttribute('letter', element.letter);
        tileInDialog.classList.add("blankTileLetters");
        tileInDialog.onclick = function () {
          blankTile.attr("letter", tileInDialog.getAttribute("letter"));
          blankTile.attr('src', tileInDialog.getAttribute("src"));
          tileDialog.dialog("close");
          boardTile.attr('letter', tileInDialog.getAttribute("letter"));
          update();
        };
      }
      tileDialog.append(tileInDialog);
    });

    tileDialog.dialog({
      classes: { "ui-dialog": "no-close" },
      modal: true,
      draggable: false,
      resizable: false
    });
  }

  // Refill hand on next word
  $("#next-word").click(function () {
    board.forEach(element => {
      console.log(element);
      $("#" + element).remove();
      currentRack.splice(element.index, 1);
    });

    $("#tileBoard div").each(function (index, $el) {
      $el.setAttribute("letter", -1);
    });
    board = [];
    fillRackForNextHand();
    scoreWord();
    currentScore = 0;
    $("#score").text("In-Progress Word Score: " + currentScore);
    $("#current-word").text("In-Progress Word: ");
    $("#tileBoard div").attr("used", 0);
    $("#tileBoard div").attr("eligible", 1);
    doubleCount = 0;
  })

  // Reset hand if desired
  $("#reset-tile").click(function () {
    currentRack = [];
    board = [];
    total = 0;
    currentScore = 0;

    $("#tileBoard div").each(function (index, $el) {
      $el.setAttribute("letter", -1);
    });
    $("#score").text("In-Progress Word Score: " + currentScore);
    $("#innerRack img").remove();
    $("#tileBoard div").attr("used", 0);
    makeRack();
    makeTiles(true);
  })

  // Restart entire game if desired
  $("#new-game").click(function () {
    currentRack = [];
    board = [];
    pool = [];
    total = 0;
    currentScore = 0;
    doubleCount = 0;
    $("#tileBoard div").each(function (index, $el) {
      $el.setAttribute("letter", -1);
    });
    $("#score").text("In-Progress Word Score: " + currentScore);
    $("#total-score").text("Compiled Score: " + total);
    $("#total-score").attr("currentscore", 0);
    $("#innerRack img").remove();
    $("#tileBoard div").attr("used", 0);
    $("#current-word").text("In-Progress Word: ");
    commence();
    console.log(currentRack);
  })


});
