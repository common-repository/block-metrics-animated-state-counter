<?php

// Declare the namespace for Deactivation Feedback functionality
namespace ZLGCB\DeactivationFeedback;

// Ensure the file is not accessed directly
if (!defined('ABSPATH')) {
    exit();
}

if (!class_exists('zlgcb_deactivation_feedback')) {
    class zlgcb_deactivation_feedback
    {
        public function __construct()
        {
            // Handle AJAX requests for deactivation forms
            add_action('wp_ajax_zlgcb_handle_deactivation_form', array($this, 'zlgcb_handle_deactivation_form'));

            // Hook the function to the admin_notices action
            add_action('admin_notices', array($this, 'zlgcb_display_plugin_notice_box'));
        }

        // Handles AJAX requests for deactivation feedback.
        public function zlgcb_handle_deactivation_form()
        {
            // Verify the nonce to ensure the request is coming from a valid source
            if (! isset($_POST['nonce']) || ! wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'zlgcb_deactivation_nonce')) {
                wp_send_json_error('Nonce verification failed.'); // Send a JSON error response if nonce verification fails
                wp_die(); // Terminate script execution
            }

            // Check if 'reason' is set in the POST request
            if (isset($_POST['reason'])) {
                // Get the current user information
                $current_user = wp_get_current_user();

                // Send data to Google Apps Script via a POST request
                $webhook_url = esc_url_raw('https://script.google.com/macros/s/AKfycbzLH_HRiDyYBq0d-_B887Yw-m4OVdwomUhBe0agnXWWItaQIRoceOVQpKrnqX9bK1qeUw/exec');

                // Unsplash and sanitize the reason for deactivation immediately after access
                $unslashed_reason = sanitize_textarea_field(wp_unslash($_POST['reason']));

                // Sanitize and prepare data
                $data = array(
                    'user_name'  => sanitize_text_field($current_user->display_name), // Sanitize the user's display name
                    'user_email' => sanitize_email($current_user->user_email), // Sanitize the user's email
                    'user_site'  => esc_url_raw(get_home_url()), // Sanitize and escape the URL of the user's site
                    'reason'     => $unslashed_reason, // Sanitize the reason for deactivation
                );

                // Send the sanitized data to the webhook URL
                $response = wp_remote_post($webhook_url, array(
                    'method'    => 'POST',
                    'body'      => wp_json_encode($data), // Convert sanitized data to JSON
                    'headers'   => array(
                        'Content-Type' => 'application/json', // Set the content type to JSON
                    ),
                ));

                // Log an error if the request to Google Sheets fails
                if (is_wp_error($response)) {
                    error_log('Error sending data to Google Sheets: ' . $response->get_error_message());
                }
            }

            // Redirect to the URL provided in the POST request if it exists
            if (isset($_POST['redirect'])) {
                wp_redirect(esc_url_raw(wp_unslash($_POST['redirect']))); // Redirect to the specified URL
                exit; // Ensure that no further code is executed
            }

            wp_die(); // Terminate script execution
        }

        public function zlgcb_display_plugin_notice_box()
        {
            // Check if the notice has already been dismissed or reviewed
            if (isset($_COOKIE['zlgcb_counter_plugin_notice_dismissed']) || isset($_COOKIE['zlgcb_counter_plugin_review_done'])) {
                return; // Don't show the notice if cookies are set
            }

            // Output the plugin notice box with static HTML
            echo wp_kses_post(
                '
                <div class="notice notice-success is-dismissible" id="zlgcb-plugin-notice-box">
                    <p>' . esc_html__('Thank you for using our plugin! We would love to hear your feedback.', 'block-metrics-animated-state-counter') . '</p>
                    <p>
                        <button class="button button-primary" id="zlgcb-plugin-feedback-ok">
                            ' . esc_html__('OK, You deserve it!', 'block-metrics-animated-state-counter') . '
                        </button>
                        <button class="button button-secondary" id="zlgcb-plugin-feedback-maybe-later">
                            ' . esc_html__('Maybe later', 'block-metrics-animated-state-counter') . '
                        </button>
                        <button class="button button-secondary" id="zlgcb-plugin-feedback-done">
                            ' . esc_html__('Already did', 'block-metrics-animated-state-counter') . '
                        </button>
                    </p>
                </div>
                '
            );
        }
    }

    // Instantiate the plugin deactivate and feedback form
    new zlgcb_deactivation_feedback();
}