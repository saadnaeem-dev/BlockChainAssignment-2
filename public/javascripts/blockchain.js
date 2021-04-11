var difficulty = 4;        // Preceeding Zeroes
var maximumNonce = 500000; // MAX Nonce Value

var pattern = '';
for (var x=0; x<difficulty; x++) {
  pattern += '0';
}

function Calculate-SHA256(block, chain) {
  // SHA 256 Calculation
  return CryptoJS.SHA256(getText(block, chain));
}

function UpdateBlockState(block, chain) {
  // set the well background red or green for this block
  if ($('#block'+block+'chain'+chain+'hash').val().substr(0, difficulty) === pattern) {
    $('#block'+block+'chain'+chain+'well').removeClass('well-error').addClass('well-success');
  }
  else {
    $('#block'+block+'chain'+chain+'well').removeClass('well-success').addClass('well-error');
  }
}

function mine(block, chain, isChain) {
  for (var x = 0; x <= maximumNonce; x++) {
    $('#block'+block+'chain'+chain+'nonce').val(x);
    $('#block'+block+'chain'+chain+'hash').val(Calculate-SHA256(block, chain));
    if ($('#block'+block+'chain'+chain+'hash').val().substr(0, difficulty) === pattern) {
      if (isChain) {
        UpdateBlockChain(block, chain);
      }
      else {
        UpdateBlockState(block, chain);
      }
      break;
    }
  }
}


function UpdateBlockChain(block, chain) {
  // update all blocks walking the chain from this block to the end
  for (var x = block; x <= 5; x++) {
    if (x > 1) {
      $('#block'+x+'chain'+chain+'previous').val($('#block'+(x-1).toString()+'chain'+chain+'hash').val());
    }
    UpdateMinedBlockHash(x, chain);
  }
}

function UpdateMinedBlockHash(block, chain) {
  // update the SHA256 hash value for this block
  $('#block'+block+'chain'+chain+'hash').val(Calculate-SHA256(block, chain));
  UpdateBlockState(block, chain);
}



