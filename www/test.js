function request(){

    var request = new XMLHttpRequest();
    key = 'cbc783e9fb1cbd2140eeb68d9e5323e7'
    url='https://developers.zomato.com/api/v2.1/restaurant?res_id=16782899&apikey=' + key;
    request.open('GET', url, true);
    request.onload = function () {

      // Begin accessing JSON data here
      var data = JSON.parse(this.response);

      if (request.status >= 200 && request.status < 400) {
        console.log(data);
        console.log(data.location.latitude);
      } else {
        console.log('error');
      }
    }

    request.send();
}