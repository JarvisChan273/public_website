(function () {
  var file = location.pathname.split("/").filter(Boolean).pop() || "index.html";
  if (file.indexOf(".") === -1) file = "index.html";

  var links = document.querySelectorAll("nav a");
  for (var i = 0; i < links.length; i += 1) {
    var href = links[i].getAttribute("href");
    if (href === file) links[i].setAttribute("aria-current", "page");
    else links[i].removeAttribute("aria-current");
  }
})();
