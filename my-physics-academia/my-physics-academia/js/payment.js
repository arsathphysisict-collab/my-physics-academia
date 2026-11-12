(() => {
  "use strict";

  const COURSE_IDS = {
    "11": "0ec687ef-1617-43c1-8777-c56f6ce835e1",
    "12": "a0678519-b9ae-4845-a979-515107a34cb9"
  };

  const COURSE_NAMES = {
    "11": "Class 11 Physics",
    "12": "Class 12 Physics"
  };

  function showMessage(message) {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(toast._paymentTimer);
      toast._paymentTimer = setTimeout(() => toast.classList.remove("show"), 5000);
    } else {
      window.alert(message);
    }
  }

  function getErrorMessage(error, fallback) {
    if (error && error.context && typeof error.context.json === "function") {
      return error.context.json()
        .then(body => body.error || body.message || fallback)
        .catch(() => error.message || fallback);
    }
    return Promise.resolve((error && error.message) || fallback);
  }

  async function startPayment(level, button) {
    if (typeof supabaseClient === "undefined") {
      showMessage("Login service is unavailable. Please refresh the page.");
      return;
    }
    if (typeof window.Razorpay !== "function") {
      showMessage("Payment gateway is still loading. Please try again.");
      return;
    }

    const courseId = COURSE_IDS[level];
    if (!courseId) {
      showMessage("Please select a valid Physics course.");
      return;
    }

    const originalText = button.textContent;
    button.setAttribute("aria-busy", "true");
    button.style.pointerEvents = "none";
    button.textContent = "Preparing checkout...";

    try {
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !authData.user) {
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        location.assign("student-login.html?return=" + returnUrl);
        return;
      }

      const { data: order, error: orderError } =
        await supabaseClient.functions.invoke("create-razorpay-order", {
          body: { course_id: courseId }
        });

      if (orderError) {
        throw new Error(await getErrorMessage(orderError, "Could not create the payment order."));
      }
      if (!order || order.success !== true || !order.order_id || !order.key_id ||
          !Number.isInteger(order.amount) || order.currency !== "INR") {
        throw new Error((order && order.error) || "The payment order response was incomplete.");
      }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "My Physics Academia",
        description: COURSE_NAMES[level],
        order_id: order.order_id,
        prefill: { email: authData.user.email || "" },
        theme: { color: "#2f7bf5" },
        handler: async function (response) {
          showMessage("Payment received. Verifying securely...");
          try {
            const { data: verification, error: verificationError } =
              await supabaseClient.functions.invoke("verify-razorpay-payment", {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }
              });

            if (verificationError) {
              throw new Error(await getErrorMessage(
                verificationError,
                "Payment verification is still pending."
              ));
            }
            if (!verification || verification.success !== true ||
                verification.course_id !== courseId ||
                !verification.payment_id) {
              throw new Error((verification && verification.error) ||
                "The server did not confirm this payment.");
            }

            sessionStorage.setItem("mpa_verified_payment", JSON.stringify({
              course: COURSE_NAMES[level],
              paymentId: verification.payment_id,
              amount: order.amount,
              currency: order.currency
            }));
            location.assign("order-success.html");
          } catch (error) {
            console.error("Payment verification requires follow-up:", error);
            showMessage("Payment was submitted, but confirmation is pending. Do not pay again. Please contact support with your Razorpay Payment ID: " +
              (response.razorpay_payment_id || "not available"));
            button.style.pointerEvents = "";
            button.removeAttribute("aria-busy");
            button.textContent = originalText;
          }
        },
        modal: {
          ondismiss: function () {
            button.style.pointerEvents = "";
            button.removeAttribute("aria-busy");
            button.textContent = originalText;
            showMessage("Checkout was closed. If you approved a UPI payment, check My Learning before trying again. Do not pay again until the payment status is clear.");
          }
        }
      };

      const checkout = new window.Razorpay(options);
      checkout.on("payment.failed", function (response) {
        console.warn("Razorpay payment failed:", response.error);
        showMessage("Payment was not completed. You can try again.");
        button.style.pointerEvents = "";
        button.removeAttribute("aria-busy");
        button.textContent = originalText;
      });
      checkout.open();
    } catch (error) {
      console.error("Checkout could not start:", error);
      showMessage(error.message || "Unable to start checkout. Please try again.");
      button.style.pointerEvents = "";
      button.removeAttribute("aria-busy");
      button.textContent = originalText;
    }
  }

  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-buy-course]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();

    const level = button.dataset.buyCourse === "dynamic"
      ? new URLSearchParams(location.search).get("class")
      : button.dataset.buyCourse;

    startPayment(level, button);
  });
})();
