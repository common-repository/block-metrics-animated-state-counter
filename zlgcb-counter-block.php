<?php

/**
 * Plugin Name: Block Metrics - Animated State Counter
 * Description: Display the state numbers as an animated counter (from start to end).
 * Plugin URI: 
 * Version: 1.0.0
 * Author: Zluck Solutions
 * Author URI: https://zluck.com
 * License: GPLv3 or later
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain: block-metrics-animated-state-counter
 */

// Declare the namespace for the Counter Block plugin
namespace ZLGCB\CounterBlock;

// Ensure the file is not accessed directly
if (!defined('ABSPATH')) {
    exit();
}

// Define the absolute path to the includes file
$deactivation_feedback_file = plugin_dir_path(__FILE__) . 'includes/deactivation-feedback.php';

// Check if the file exists before including it
if (file_exists($deactivation_feedback_file)) {
    require_once $deactivation_feedback_file;
} else {
    // Optional: Log an error or handle the missing file scenario gracefully
    error_log('Required file "deactivation-feedback.php" is missing.');
}

// Check class is exist of not
if (!class_exists('zlgcb_register_counter_block')) {
    class zlgcb_register_counter_block
    {
        public function __construct()
        {
            // Hook the block registration function into the 'init' action
            add_action('init', array($this, 'zlgcb_register_counter_block'));

            // Hook the function to enqueue admin assets into the 'admin_enqueue_scripts' action
            add_action('admin_enqueue_scripts', array($this, 'zlgcb_register_counter_block_admin_assets'));
        }

        // Register block assets
        public function zlgcb_register_counter_block()
        {
            // Register the block editor script
            wp_register_script(
                'zlgcb-counter-block-editor',
                plugins_url('block/block.js', __FILE__),
                array('wp-blocks', 'wp-element', 'wp-editor'), // Dependencies
                filemtime(plugin_dir_path(__FILE__) . 'block/block.js'), // Cache-busting with file modification time
                true,
            );

            // Register the block frontend style
            wp_register_style(
                'zlgcb-counter-block',
                plugins_url('public/css/style.css', __FILE__),
                array(),
                filemtime(plugin_dir_path(__FILE__) . 'public/css/style.css'), // Cache-busting with file modification time
            );

            // Register the frontend script for the counter animation
            wp_register_script(
                'zlgcb-counter-block-frontend',
                plugins_url('public/js/frontend.js', __FILE__),
                array('jquery'), // Dependency on jQuery
                filemtime(plugin_dir_path(__FILE__) . 'public/js/frontend.js'), // Cache-busting with file modification time
                true // Load script in the footer
            );

            // Register the block type with its scripts and styles
            register_block_type('zlgcb-counter/block', array(
                'editor_script' => 'zlgcb-counter-block-editor', // Editor script handle
                'style'         => 'zlgcb-counter-block', // Frontend style handle
                'script'        => 'zlgcb-counter-block-frontend', // Frontend script handle
            ));
        }

        // Enqueue admin assets for the block
        public function zlgcb_register_counter_block_admin_assets($hook_suffix)
        {
            // Register the style for the block editor.
            wp_register_style(
                'zlgcb-counter-block-editor',
                plugins_url('admin/css/editor.css', __FILE__), // URL to the CSS file
                array('wp-edit-blocks'), // Dependencies: WordPress block editor styles
                filemtime(plugin_dir_path(__FILE__) . 'admin/css/editor.css') // Version parameter: File modification time for cache-busting
            );

            // Enqueue the registered style
            wp_enqueue_style('zlgcb-counter-block-editor');

            // Check if we are on the Plugins page to enqueue the script
            if ($hook_suffix === 'plugins.php') {
                // Enqueue the script for the deactivation popup
                wp_enqueue_script(
                    'zlgcb-admin',
                    plugin_dir_url(__FILE__) . 'admin/js/admin.js', // URL to the JavaScript file
                    array('jquery'), // Dependencies: jQuery
                    filemtime(plugin_dir_path(__FILE__) . 'admin/js/admin.js'), // Version parameter: File modification time for cache-busting
                    true // Load the script in the footer
                );

                // Localize the script with necessary data
                wp_localize_script('zlgcb-admin', 'ajax_obj', array(
                    'ajax_url' => admin_url('admin-ajax.php'), // URL for AJAX requests
                    'nonce'    => wp_create_nonce('zlgcb_deactivation_nonce') // Nonce for security
                ));
            }
        }
    }

    // Instantiate the block registration class
    new zlgcb_register_counter_block();
}
