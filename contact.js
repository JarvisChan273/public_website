(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var status = document.getElementById("contact-status");
  var button = form.querySelector("button");
  var idempotencyKey = "";

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
    if (!idempotencyKey) idempotencyKey = crypto.randomUUID();

    button.disabled = true;
    status.textContent = "Sending…";

    fetch(form.action, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
      },
      body: JSON.stringify({
        subject: form.subject.value,
        email: form.email.value,
        message: form.message.value,
      }),
    })
      .then(function (response) {
        return response.json().then(
          function (body) {
            return { status: response.status, body: body };
          },
          function () {
            return { status: response.status, body: null };
          },
        );
      })
      .then(function (result) {
        button.disabled = false;
        if (result.status === 202 && result.body && result.body.id) {
          status.textContent = "Received. Reference " + result.body.id + ".";
          var fields = form.querySelectorAll("input, textarea");
          for (var i = 0; i < fields.length; i += 1) {
            fields[i].value = "";
            fields[i].defaultValue = "";
          }
          idempotencyKey = "";
          return;
        }
        if (result.status === 400) idempotencyKey = "";
        status.textContent =
          "The note was not accepted. Check the subject, email, and message, then try again.";
      })
      .catch(function () {
        button.disabled = false;
        status.textContent = "The note could not be sent. Try again later.";
      });
  });
})();
