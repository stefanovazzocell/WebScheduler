$().ready(function () {
  if (window.location.hash.slice(1) == 'wp') {
    $('#alert-wp').show();
  }
  if (window.location.hash.slice(1) == 'bf') {
    $('#alert-bf').show();
  }
  if (typeof(Storage) !== "undefined") {
    localStorage.clear();
  }
  $('#ta-login').submit(function (event) {
    event.preventDefault();
    window.location.replace('/#' + $('#ta-secret').val());
  });
  $('#coordinator-login').submit(function (event) {
    event.preventDefault();
    window.location.replace('/admin/#' + $('#coordinator-secret').val());
  });
});
