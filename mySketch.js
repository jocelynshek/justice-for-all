let justiceData;
let edge1, edge2, top1, top2, middleVert;
let gifts = [];
let viewMode = 'year'; // 'year' or 'recipient'
let maxGiftValue = 0;
let transitionProgress = 0;
let justiceCounts = {}; // to store number of gifts per justice
let baseBoxHeight = 0;
let columns = 25;
let scaleFactor = 0.5;
let hoveredGift = null;
let showLabels = false; // Initially hide labels and axes
const gap = 0.2;

function preload() {
  justiceData = loadTable('scj - 2000-2024 (2).csv', 'csv', 'header');
  mainFont = 'Georgia';
	cooperHewitt = loadFont('CooperHewitt-Heavy.ttf')
	ssp_Light = loadFont('open-sans.regular.ttf');
	
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  processGifts();
  calculateBaseBoxHeight();
  noLoop();
	
	edge1 = 20;
	edge2 = windowWidth-20;
	top1 = 20;
	top2 = windowHeight*8/10;
	middleVert = 2*windowWidth/3;
}

function processGifts() {
  // Pre-create the GiftBox for each data row
  for (let i = 0; i < justiceData.getRowCount(); i++) {
    let justiceName = justiceData.getString(i, 'Justice Name');
    let gift = justiceData.getString(i, 'Gift');
		let source = justiceData.getString(i, 'Source');
    let value = parseFloat(justiceData.getString(i, 'Value').replace(/,/g, ''));

    // Skip non-numerical or invalid values
    if (isNaN(value) || value <= 0) continue;

    let year = justiceData.getString(i, 'Year');

    if (value > maxGiftValue) {
      maxGiftValue = value;
    }

    gifts.push(new GiftBox(justiceName, gift, value, year, source));
  }
}

function calculateBaseBoxHeight() {
  // Calculate the base height of the boxes relative to the gift value
  baseBoxHeight = (height * 0.8) / maxGiftValue;
}

function draw() {
  background(255, 250, 250);

  transitionProgress = min(transitionProgress + 0.04, 1); // Smooth transition between 0 and 1

  if (viewMode === 'year') {
    columns = 25;
    drawByYear();
  } else if (viewMode === 'recipient') {
    columns = 19;
    drawByRecipient();
  }

  gifts.forEach(gift => {
    gift.update();
    if (gift.hovered) {
      hoveredGift = gift;
    }
  });

  // Render the hover box after all other elements
  if (hoveredGift) {
    hoveredGift.showHoverBox();
    hoveredGift = null; // Reset after rendering
  }
	
		fill(191, 42, 32);
		stroke(191, 42, 32);
		rectMode(CORNER);
		strokeWeight(1);
		rect(0, 0, edge1, windowHeight);
		rect(0, top2, windowWidth, windowHeight-top2);
		rect(0, 0, windowWidth, top1);
		rect(edge2, 0, windowWidth-edge2, windowHeight);
	
	stroke(255);
	fill(255);
  textAlign(LEFT);
  textFont(cooperHewitt, 60);
  textStyle(BOLD);
  text("JUSTICE FOR ALL.", 2*edge1, top1+top2 + 50);
	
	textFont(ssp_Light);
	
	if(!showLabels){
		textStyle(NORMAL);
		textFont(ssp_Light);
		fill(255);
    textSize(27);
		text("Toggle between '1' and '2' to learn more.", 2*edge1, top1+top2+90);
	}
	
	  if (showLabels) {
		fill(255);
    textStyle(NORMAL);
    textSize(27);
    text("Supreme Court Justices' Gifts, 2000-2024", 2*edge1, top1+top2+90);
		textSize(20);
		text("Each interactive box represents one gift made to a \nSupreme Court Justice, scaled by relative value.", middleVert, top1+top2+20);
  }
}

function drawLeftAxis(maxBoxHeight, maxGivenValue, boxWidth) {
  fill(0);
  textAlign(RIGHT);
  textSize(14);
  let axisPadding = edge1 + 70;

  // Determine increments and max value based on view mode
  let increment = viewMode === 'year' ? 100000 : 500000;
  let maxValue = viewMode === 'year' ? 600000 : 3000000;


  let axisStart = top2 - 40;
  let axisHeight = axisStart - 100;
	
  fill(2, 91, 169);
  rectMode(CORNER);
  rect(4.9 * windowWidth / 6, top1+20, boxWidth, (maxBoxHeight / maxGivenValue) * 80610);
  fill(0);
	textAlign(LEFT);
  text("Median annual household \nincome: $80,610", 4.9 * windowWidth / 6 + boxWidth + 8, top1+32);
	textAlign(RIGHT);

  for (let value = 0; value <= maxValue; value += increment) {
    let yPos = axisStart - (maxBoxHeight / maxGivenValue) * value; // Map value to Y-axis
		
    if (value < 1000000) {
      text(`$${(value / 1000).toFixed(0)}K`, axisPadding - 10, yPos + 5); // Display labels as "$XK" for thousands
    }
    if (value >= 1000000) {
      text(`$${(value / 1000000).toFixed(0)}M`, axisPadding - 10, yPos + 5); // Display labels as "$XM" for millions
    }

    stroke(0);
    line(axisPadding, yPos, axisPadding + 10, yPos);
    noStroke();
  }
}


function drawByYear() {
  scaleFactor = 0.68;
  let yearBuckets = {}; // to collect gifts by year
  let yearTotals = {}; // to store total values by year
  let maxBoxHeight = 0; // Track the maximum box height in the view

  gifts.forEach(gift => {
    if (!yearBuckets[gift.year]) {
      yearBuckets[gift.year] = [];
      yearTotals[gift.year] = 0;
    }
    yearBuckets[gift.year].push(gift);
    yearTotals[gift.year] += gift.value; // Add to total value for this year
  });
	
	let maxYearValue = Math.max(...Object.values(yearTotals));

  let years = Object.keys(yearBuckets).sort(); // Sort years chronologically
  let columnWidth = width / (columns + 3);

  for (let i = 0; i < years.length; i++) {
    let year = years[i];
    let xPos = 2 * columnWidth + ((i % columns) * columnWidth + columnWidth / 2);

    // Sort the gifts by value (largest to smallest) so the biggest box is at the bottom
    yearBuckets[year].sort((a, b) => b.value - a.value);

    // Calculate the y position starting from the bottom of the canvas
    let yPosBase = top2 - 40;
    let totalColumnHeight = 0;

    yearBuckets[year].forEach((gift, idx) => {
      let boxHeight = gift.value * baseBoxHeight * scaleFactor;
      yPosBase -= boxHeight; // Shift the box upwards by its height
      totalColumnHeight += boxHeight + gap;
      gift.setTarget(xPos, yPosBase, columnWidth);
      yPosBase -= gap; // Add the gap after placing the box
    });

    // Keep track of the maximum column height
    if (totalColumnHeight > maxBoxHeight) {
      maxBoxHeight = totalColumnHeight;
    }

    if (showLabels) {
      fill(0);
      textAlign(CENTER);
      textSize(13);
			text(`$${Number(yearTotals[year].toFixed(0)).toLocaleString()}`, xPos, yPosBase - 15);

      textSize(12);
      text(year, xPos, top2 - 20);
    }
  }

  if (showLabels) {
    drawLeftAxis(maxBoxHeight, maxYearValue, columnWidth);
  }
}

function drawByRecipient() {
  scaleFactor = 0.137;
  let recipients = {};
  let recipientTotals = {};
  let maxBoxHeight = 0;

  // Group gifts by the justice/recipient
  gifts.forEach(gift => {
    if (!recipients[gift.justice]) {
      recipients[gift.justice] = [];
      recipientTotals[gift.justice] = 0;
    }
    recipients[gift.justice].push(gift);
    recipientTotals[gift.justice] += gift.value;
  });

  // Find the maximum total value across all recipients
  let maxRecipientValue = Math.max(...Object.values(recipientTotals));

  // Get recipient names and sort them by total value in descending order
  let names = Object.keys(recipients).sort((a, b) => recipientTotals[b] - recipientTotals[a]);
  let columnWidth = width / (columns + 1); // Width of each column

  for (let i = 0; i < names.length; i++) {
    let name = names[i];
    let xPos = 2 * columnWidth + (i % columns) * columnWidth;

    recipients[name].sort((a, b) => b.value - a.value);

    let yPosBase = top2 - 40;
    let totalColumnHeight = 0;

    recipients[name].forEach((gift, idx) => {
      let boxHeight = gift.value * baseBoxHeight * scaleFactor;
      yPosBase -= boxHeight;
      totalColumnHeight += boxHeight + gap;
      gift.setTarget(xPos, yPosBase, columnWidth);
      yPosBase -= gap;
    });

    if (totalColumnHeight > maxBoxHeight) {
      maxBoxHeight = totalColumnHeight;
    }

    if (showLabels) {
      fill(0);
      textAlign(CENTER);
      textSize(13);
      text(`$${Number(recipientTotals[name].toFixed(0)).toLocaleString()}`, xPos, yPosBase - 15);

      push(); // Start a new drawing state
      translate(xPos, top2-19);
      rotate(PI / 18); // Rotate the text
      textSize(11.7);
      text(name, 0, 0); // Draw the text at the rotated position
      pop(); // Restore the original drawing state
    }
  }

  if (showLabels) {
    drawLeftAxis(maxBoxHeight, maxRecipientValue, columnWidth);
  }
}


function mouseMoved() {
  gifts.forEach(gift => {
    gift.checkHover(mouseX, mouseY);
  });
}

function keyPressed() {
  // Enable labels and axes after the first key press
  if (!showLabels) {
    showLabels = true;
    loop();
  } else {
    if (key === '1') {
      viewMode = 'year';
      transitionProgress = 0; // Reset transition
      loop();
    } else if (key === '2') {
      viewMode = 'recipient';
      transitionProgress = 0; // Reset transition
      loop();
    }
  }
	
}
class GiftBox {
  constructor(justice, gift, value, year, source) {
    this.justice = justice;
    this.gift = gift;
    this.value = value;
		this.source = source;
    this.year = year;
    this.hovered = false;
    this.boxColor = color(2, 91, 169);
    this.currentX = random(width);
    this.currentY = random(height);
    this.targetX = this.currentX;
    this.targetY = this.currentY;
    this.w = 0; // Start with zero width and interpolate
  }

  setTarget(x, y, columnWidth) {
    this.targetX = x;
    this.targetY = y;
    this.w = columnWidth * 0.8; // Make the box take 80% of the column width
    this.h = this.value * baseBoxHeight * scaleFactor; // Height  proportional to the gift value
  }

  update() {
    // Interpolate positions
    this.currentX = lerp(this.currentX, this.targetX, transitionProgress * 1 / 3);
    this.currentY = lerp(this.currentY, this.targetY, transitionProgress * 1 / 3);

    // Adjust the opacity based on the value of the gift (lower values are more transparent)
    let opacity = map(this.value, 0, maxGiftValue, 170, 255);

    // Draw the box starting from bottom-left corner
    rectMode(CORNER); // Ensure rectangles are drawn from the top-left
    if (this.hovered) {
      fill(227, 72, 54, opacity); // Highlight with opacity
    } else {
      fill(this.boxColor.levels[0], this.boxColor.levels[1], this.boxColor.levels[2], opacity); // Apply opacity to box color
    }
    rect(this.currentX - this.w / 2, this.currentY, this.w, this.h); // Adjust the x for centering
  }

  showHoverBox() {
    let justiceText = `${this.justice}, ${this.year}, from ${this.source}`;
    let giftText = `${this.gift}`;
		let sourceText = `${this.source}`;
    let valueText = `$${this.value.toLocaleString()}`;

    textSize(12);

    let justiceWidth = textWidth(justiceText);
    let giftWidth = textWidth(giftText);
    let infoWidth = max(justiceWidth, giftWidth) + 20;
    infoWidth = max(infoWidth, 110); // Minimum box width

    let popupHeight = 60; // Box height to accommodate multiple lines

    let xPos, yPos;
    if (mouseY <= 0.6 * windowHeight) {
      if (mouseX <= 0.5 * windowWidth) {
        xPos = mouseX + 10; 
        yPos = mouseY + 10;
      } else {
        xPos = mouseX - infoWidth - 10;
        yPos = mouseY + 10;
      }
    } else {
      if (mouseX <= 0.5 * windowWidth) {
        xPos = mouseX + 10;
        yPos = mouseY - popupHeight - 10;
      } else {
        xPos = mouseX - infoWidth - 10;
        yPos = mouseY - popupHeight - 10;
      }
    }

    fill(255);
    stroke(0);
    rect(xPos, yPos, infoWidth, popupHeight, 5);

    fill(0);
    noStroke();
    textAlign(LEFT);
    text(justiceText, xPos + 10, yPos + 20);
    text(giftText, xPos + 10, yPos + 35);
    text(valueText, xPos + 10, yPos + 50);
  }

  checkHover(mx, my) {
    this.hovered = mx > this.currentX - this.w / 2 && mx < this.currentX + this.w / 2 &&
                   my > this.currentY && my < this.currentY + this.h;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateBaseBoxHeight(); // Recalculate box size on resize
  redraw();
}
