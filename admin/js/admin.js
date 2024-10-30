jQuery(document).ready(function ($) {
  "use strict";
  // Function to create and display the modal
  function showModal(deactivateUrl) {
    // Create the modal form HTML
    var modalHtml = `
        <div id="zlgcb-deactivation-modal" class="zlgcb-plugin-deactivate-pop-up">
            <div class="zlgcb-plugin-deactivate-pop-up-content">
                <h2>Block Metrics Feedback</h2>
                <h3>If you have a moment, please let us know why you are deactivating:</h3>
                <form id="zlgcb-deactivation-form">
                    <div class="form-body">
                        <ul class="zlgcb-reasons">
                            <li class="reason">
                                <label>
                                    <input type="radio" name="selected_reason" value="I found a better plugin.">
                                    <span>I found a better plugin</span>
                                </label>
                            </li>
                            <li class="reason">
                                <label>
                                    <input type="radio" name="selected_reason" value="This plugin does not work on my site">
                                    <span>This plugin does not work on my site</span>
                                </label>
                            </li>
                            <li class="reason">
                                <label>
                                    <input type="radio" name="selected_reason" value="Design is outdated, difficult to navigate">
                                    <span>Design is outdated, difficult to navigate</span>
                                </label>
                            </li>
                            <li class="reason">
                                <label>
                                    <input type="radio" name="selected_reason" value="It's just temporary. I will be back soon.">
                                    <span>It's just temporary. I will be back soon</span>
                                </label>
                            </li>
                            <li class="reason">
                                <label>
                                    <input type="radio" name="selected_reason" value="It is not what I am looking for.">
                                    <span>It is not what I am looking for</span>
                                </label>
                            </li>
                            <li class="reason">
                                <label>
                                    <input type="radio" name="selected_reason" value="I am finding it difficult to configure it as per my needs">
                                    <span>I am finding it difficult to configure it as per my needs</span>
                                </label>
                            </li>
                            <li class="reason">
                                <label>
                                    <input type="radio" name="selected_reason" value="other">
                                    <span>Other</span>
                                </label>
                                <div>
                                    <textarea id="other_reason" name="other_reason" placeholder="Enter your reason (please specify)" class="zlgcb-other-reason"></textarea>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div class="zlgcb-form-footer">
                        <input type="submit" class="button button-secondary" value="Submit and Deactivate">
                        <input type="button" id="zlgcb-skip-feedback-btn" class="button button-secondary" value="Skip and Deactivate">
                    </div>
                </form>
                <button id="zlgcb-modal-close" class="zlgcb-cancel-btn">
                    <svg height="18px" width="18px" id="Layer_1" style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M443.6,387.1L312.4,255.4l131.5-130c5.4-5.4,5.4-14.2,0-19.6l-37.4-37.6c-2.6-2.6-6.1-4-9.8-4c-3.7,0-7.2,1.5-9.8,4  L256,197.8L124.9,68.3c-2.6-2.6-6.1-4-9.8-4c-3.7,0-7.2,1.5-9.8,4L68,105.9c-5.4,5.4-5.4,14.2,0,19.6l131.5,130L68.4,387.1  c-2.6,2.6-4.1,6.1-4.1,9.8c0,3.7,1.4,7.2,4.1,9.8l37.4,37.6c2.7,2.7,6.2,4.1,9.8,4.1c3.5,0,7.1-1.3,9.8-4.1L256,313.1l130.7,131.1  c2.7,2.7,6.2,4.1,9.8,4.1c3.5,0,7.1-1.3,9.8-4.1l37.4-37.6c2.6-2.6,4.1-6.1,4.1-9.8C447.7,393.2,446.2,389.7,443.6,387.1z"/></svg>
                </button>
            </div>
        </div>
    `;

    // Append modal HTML to body
    $("body").append(modalHtml);
    $("#zlgcb-deactivation-modal").fadeIn();

    // Handle radio button change to show/hide textarea
    $("input[name='selected_reason']").on("change", function () {
      var $textarea = $("textarea[name='other_reason']");
      if ($(this).val() === "other") {
        $textarea.show().prop("required", true);
      } else {
        $textarea.hide().prop("required", false);
      }
    });

    // Handle form submission
    $("#zlgcb-deactivation-form").on("submit", function (e) {
      e.preventDefault();

      var $submitButton = $(this).find('input[type="submit"]');
      $submitButton.prop("disabled", true);

      var selectedReason = $("input[name='selected_reason']:checked").val();
      var otherReason = $("#other_reason").val().trim();

      var reason = selectedReason === "other" ? otherReason : selectedReason;

      if (!selectedReason) {
        alert("Please select a reason for deactivating.");
        $submitButton.prop("disabled", false);
        return;
      }

      $.ajax({
        url: ajax_obj.ajax_url,
        type: "POST",
        data: {
          action: "zlgcb_handle_deactivation_form",
          reason: reason,
          redirect: deactivateUrl,
          nonce: ajax_obj.nonce,
        },
        success: function (response) {
          $("#zlgcb-deactivation-modal").fadeOut(function () {
            $(this).remove();
            window.location.href = deactivateUrl;
          });
        },
        error: function (jqXHR, textStatus, errorThrown) {
          alert("AJAX request failed: " + textStatus + " - " + errorThrown);
        },
        complete: function () {
          setTimeout(function () {
            $submitButton.prop("disabled", false);
          }, 5000);
        },
      });
    });

    // Handle modal close button
    $(document).on("click", "#zlgcb-modal-close", function () {
      $("#zlgcb-deactivation-modal").fadeOut(function () {
        $(this).remove();
      });
    });

    // Handle skip feedback button
    $(document).on("click", "#zlgcb-skip-feedback-btn", function () {
      $("#zlgcb-deactivation-modal").fadeOut(function () {
        $(this).remove();
        window.location.href = deactivateUrl;
      });
    });
  }

  // Attach event handler to deactivate link
  $(document).on(
    "click",
    "#deactivate-block-metrics-animated-state-counter",
    function (e) {
      e.preventDefault();
      showModal($(this).attr("href"));
    }
  );

  // Handle click events for feedback buttons in the plugin notice box
  $("#zlgcb-plugin-feedback-ok").on("click", function () {
    // User clicked "OK, You deserve it!" - remove the notice and redirect to the feedback page
    $("#zlgcb-plugin-notice-box").remove();
    window.location.href = "#";
  });

  $("#zlgcb-plugin-feedback-maybe-later").on("click", function () {
    // User clicked "Maybe later" - remove the notice and set a cookie to hide it for 7 days
    $("#zlgcb-plugin-notice-box").remove();
    var date = new Date();
    date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000); // Set cookie to expire in 7 days
    document.cookie =
      "zlgcb_counter_plugin_notice_dismissed=" +
      date.getTime() +
      "; expires=" +
      date.toUTCString() +
      "; path=/";
  });

  $("#zlgcb-plugin-feedback-done").on("click", function () {
    // User clicked "Already did" - remove the notice and set a cookie indicating the feedback has been given
    $("#zlgcb-plugin-notice-box").remove();
    var date = new Date();
    date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000); // Set cookie to expire in 1 year
    document.cookie =
      "zlgcb_counter_plugin_review_done=" +
      date.getTime() +
      "; expires=" +
      date.toUTCString() +
      "; path=/";
  });
});
