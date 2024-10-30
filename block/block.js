(function (blocks, element, editor, components, blockEditor) {
  wp.domReady(function () {
    "use strict";

    // Import necessary elements and components from WordPress libraries
    const { createElement: el, useState, useEffect } = element;
    const { InspectorControls } = blockEditor;
    const { MediaUpload } = blockEditor;
    const {
      PanelBody,
      TextControl,
      RangeControl,
      ColorPalette,
      Button,
      SelectControl,
      PanelRow,
      Dropdown,
      MenuGroup,
      MenuItem,
      SVG,
      Path,
    } = components;

    /**
     * Function to create an attribute object for a Gutenberg block.
     *
     * @param {string} attributeName - The name of the attribute to create.
     * @param {string} attributeType - The type of the attribute (e.g., "string", "number").
     * @param {*} defaultVal - The default value for the attribute.
     *
     * @returns {object} - The attribute object with the specified name, type, and default value.
     */
    function zlgcbCreateAttributes(attributeName, attributeType, defaultVal) {
      // Initialize an empty object to store the attribute
      const attribute = {};

      // Create an attribute object with the specified type and default value
      attribute[attributeName] = {
        type: attributeType,
        default: defaultVal,
      };

      // Return the created attribute object
      return attribute;
    }

    /**
     * Creates responsive attributes for a given attribute name, type, and default values.
     *
     * @param {string} attributeName - The base name of the attribute.
     * @param {string} attributeType - The type of the attribute (e.g., "string", "number").
     * @param {object} defaultValues - An object containing default values for desktop, tablet, and mobile.
     * @param {any} defaultValues.desktop - The default value for the desktop version of the attribute.
     * @param {any} defaultValues.tablet - The default value for the tablet version of the attribute.
     * @param {any} defaultValues.mobile - The default value for the mobile version of the attribute.
     *
     * @returns {object} An object containing the responsive attributes for desktop, tablet, and mobile.
     */
    function zlgcbCreateResponsiveAttributes(
      attributeName,
      attributeType,
      defaultValues
    ) {
      return {
        // Create the desktop version of the attribute
        [`${attributeName}Desktop`]: {
          type: attributeType,
          default: defaultValues.desktop,
        },
        // Create the tablet version of the attribute
        [`${attributeName}Tablet`]: {
          type: attributeType,
          default: defaultValues.tablet,
        },
        // Create the mobile version of the attribute
        [`${attributeName}Mobile`]: {
          type: attributeType,
          default: defaultValues.mobile,
        },
      };
    }

    /**
     * Retrieves the responsive attribute name based on the current responsive setting.
     *
     * @param {object} attributes - The attributes object containing various attribute settings.
     * @param {string} attributeName - The base name of the attribute.
     *
     * @returns {string} The responsive attribute name for the current setting (desktop, tablet, or mobile).
     */
    function zlgcbGetResponsiveAttribute(attributes, attributeName) {
      switch (attributes.counterNumberResponsive) {
        case "tablet":
          // Return the tablet version of the attribute
          return `${attributeName}Tablet`;
        case "mobile":
          // Return the mobile version of the attribute
          return `${attributeName}Mobile`;
        default:
          // Return the desktop version of the attribute
          return `${attributeName}Desktop`;
      }
    }

    /**
     * Function to create a common control element for various attributes.
     *
     * @param {string} controlName - The type of control element (e.g., TextControl, SelectControl).
     * @param {object} attributes - The attributes object containing the current values.
     * @param {string} attributeLabel - The label to display for the control.
     * @param {string} attributeType - The type of the attribute (e.g., "number", "text").
     * @param {string} attributeName - The key of the attribute in the attributes object.
     * @param {function} setAttributes - The function to update the attributes object.
     * @param {number|null} [min=null] - The minimum value for the control (if applicable).
     * @param {number|null} [max=null] - The maximum value for the control (if applicable).
     *
     * @returns {Element} - The created control element.
     */
    function zlgcbCommonControl(
      controlName,
      attributes,
      attributeLabel,
      attributeType,
      attributeName,
      setAttributes,
      min = null,
      max = null
    ) {
      return el(controlName, {
        label: attributeLabel,
        type: attributeType, // Specify the type explicitly
        value:
          attributes[attributeName] !== undefined
            ? attributes[attributeName]
            : "", // Ensure the value is a string
        onChange: function (value) {
          if (attributeType === "number") {
            const parsedValue = parseFloat(value); // Parse the string value to a float

            // Check if the parsed value is NaN (Not a Number) or exceeds min/max limits
            if (
              !isNaN(parsedValue) &&
              (min === null || parsedValue >= min) &&
              (max === null || parsedValue <= max)
            ) {
              setAttributes({
                [attributeName]: parsedValue, // Set the attribute as a number
              });
            }
          } else {
            // For string attributes, directly set the value
            setAttributes({
              [attributeName]: value,
            });
          }
        },
        min: min,
        max: max,
      });
    }

    /**
     * Generates a SelectControl component with specified properties and behavior.
     *
     * @param {object} attributes - The current attributes object.
     * @param {string} label - The label for the SelectControl.
     * @param {string} attributeName - The name of the attribute to be updated.
     * @param {Array} attributeOptions - An array of options for the SelectControl.
     * @param {string} className - The CSS class name for styling purposes.
     * @param {function} setAttributes - Function to update the component's attributes.
     * @returns {JSX.Element} - Returns the SelectControl component.
     */
    function zlgcbSelectControl(
      attributes,
      label,
      attributeName,
      attributeOptions,
      className,
      setAttributes
    ) {
      return el(SelectControl, {
        className: className,
        label: label,
        value:
          attributes[attributeName] !== undefined
            ? attributes[attributeName]
            : "", // Ensure the value is defined
        options: attributeOptions.map((option) => ({
          label: option.label,
          value: option.value,
        })),
        onChange: function (value) {
          // Create a new attributes object with updated value
          const newAttributes = {
            ...attributes,
            [attributeName]: value,
          };
          // Call setAttributes to update the component's attributes
          setAttributes(newAttributes);
        },
      });
    }

    /**
     * Creates a dropdown control with a custom label and content.
     *
     * @param {string} label - The HTML content or icon to be displayed as the button label.
     * @param {React.Element} content - The content to be displayed within the dropdown menu.
     * @returns {React.Element} A dropdown control with a toggle button and a dropdown menu.
     */
    function zlgcbDropdownControl(label, content) {
      // useState hook to manage the open/closed state of the dropdown
      const [isOpen, setIsOpen] = useState(false);

      return el(Dropdown, {
        className: "zlgcb-button-dropdown", // Custom class for styling the dropdown
        contentClassName: "zlgcb-button-dropdown-content", // Custom class for styling the dropdown content
        popoverProps: { placement: "bottom left" }, // Set the dropdown placement
        renderToggle: (
          { isOpen, onToggle } // Function to render the toggle button
        ) =>
          el(
            Button,
            {
              onClick: onToggle, // Toggle the dropdown on button click
              "aria-expanded": isOpen, // ARIA attribute for accessibility
            },
            // Span element to display the custom label or icon
            el("span", {
              className: "zlgcb-dropdown-icon", // Custom class for styling the label/icon
              dangerouslySetInnerHTML: {
                __html: `${label}`, // Set the inner HTML of the span to the label content
              },
            })
          ),
        renderContent: () => el(MenuGroup, null, content), // Function to render the dropdown content
      });
    }

    /**
     * Creates a dropdown select control with icons for each option.
     *
     * @param {object} attributes - The attributes of the component.
     * @param {string} label - The label for the select control.
     * @param {string} attributeName - The name of the attribute being controlled.
     * @param {Array} attributeOptions - The options for the select control.
     * @param {function} setAttributes - The function to update attributes.
     * @returns {React.Element} A dropdown select control with icons.
     */
    function zlgcbSelectControlWithIcons(
      attributes,
      label,
      attributeName,
      attributeOptions,
      setAttributes
    ) {
      // useState hook to manage the open/closed state of the dropdown
      const [isOpen, setIsOpen] = useState(false);
      // useState hook to manage the selected value
      const [selectedValue, setSelectedValue] = useState(
        attributes[attributeName] !== undefined ? attributes[attributeName] : ""
      );

      // useEffect hook to update the selected value when attributes change
      useEffect(() => {
        setSelectedValue(attributes[attributeName]);
      }, [attributes[attributeName]]);

      // Handle the change of the selected value
      const handleChange = (value) => {
        setSelectedValue(value);
        const newAttributes = {
          ...attributes,
          [attributeName]: value,
        };
        setAttributes(newAttributes);
        setIsOpen(false); // Close dropdown after selection
      };

      // Render the label or icon for each option
      const renderOptionLabel = (option) => {
        if (option.value === "mobile") {
          return el("span", {
            className: "zlgcb-responsive-dropdown-icons",
            dangerouslySetInnerHTML: {
              __html: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
              <path d="M16 64C16 28.7 44.7 0 80 0H304c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H80c-35.3 0-64-28.7-64-64V64zM224 448a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM304 64H80V384H304V64z"/>
            </svg>`,
            },
          });
        } else if (option.value === "tablet") {
          return el("span", {
            className: "zlgcb-responsive-dropdown-icons",
            dangerouslySetInnerHTML: {
              __html: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M0 64C0 28.7 28.7 0 64 0H384c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zM256 448a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM384 64H64V384H384V64z"/>
            </svg>`,
            },
          });
        } else if (option.value === "desktop") {
          return el("span", {
            className: "zlgcb-responsive-dropdown-icons",
            dangerouslySetInnerHTML: {
              __html: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
              <path d="M64 0C28.7 0 0 28.7 0 64V352c0 35.3 28.7 64 64 64H240l-10.7 32H160c-17.7 0-32 14.3-32 32s14.3 32 32 32H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H346.7L336 416H512c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H64zM512 64V288H64V64H512z"/>
            </svg>`,
            },
          });
        } else {
          return option.label; // Fallback to regular label if no icon/image
        }
      };

      return el(
        "div",
        {},
        el(Dropdown, {
          className: "zlgcb-responsive-button-dropdown",
          contentClassName: "zlgcb-responsive-button-dropdown-content",
          popoverProps: { placement: "bottom left" },
          renderToggle: ({ isOpen, onToggle }) =>
            el(
              Button,
              {
                onClick: onToggle,
                "aria-expanded": isOpen,
              },
              renderOptionLabel(
                attributeOptions.find((opt) => opt.value === selectedValue)
              )
            ),
          renderContent: () =>
            el(
              MenuGroup,
              {
                className: "zlgcb-responsive-dropdown-panel",
              },
              attributeOptions.map((option) =>
                el(
                  MenuItem,
                  {
                    key: option.value,
                    onClick: () => handleChange(option.value),
                  },
                  renderOptionLabel(option)
                )
              )
            ),
        })
      );
    }

    /**
     * Creates a grouped attribute row with a TextControl and a SelectControl for responsive settings.
     *
     * @param {object} attributes - The attributes object containing various attribute settings.
     * @param {string} attributeLabel - The label for the main attribute.
     * @param {string} attributeType - The type of the main attribute (e.g., "number", "string").
     * @param {Array<string>} attributeNames - An array containing the base names of the attributes for the main value and its unit.
     * @param {function} setAttributes - The function to update the attributes.
     * @param {number|null} min - The minimum value for the number attribute (optional).
     * @param {number|null} max - The maximum value for the number attribute (optional).
     *
     * @returns {object} The React element representing the grouped attribute row.
     */
    function zlgcbGroupedAttributeRow(
      attributes,
      attributeLabel,
      attributeType,
      attributeNames,
      setAttributes,
      min = null,
      max = null
    ) {
      return el(
        PanelRow,
        {},
        // Left side: TextControl for main attribute
        el(
          "div",
          {
            style: {
              width: "50%",
            },
          },
          el(TextControl, {
            label: attributeLabel,
            value:
              attributes[
                zlgcbGetResponsiveAttribute(attributes, attributeNames[0])
              ], // Get the responsive attribute value for TextControl
            onChange: function (value) {
              if (attributeType === "number") {
                const parsedValue = parseFloat(value); // Parse the string value to a float

                // Check if the parsed value is valid and within min/max limits
                if (
                  !isNaN(parsedValue) &&
                  (min === null || parsedValue >= min) &&
                  (max === null || parsedValue <= max)
                ) {
                  setAttributes({
                    [zlgcbGetResponsiveAttribute(
                      attributes,
                      attributeNames[0]
                    )]: parsedValue, // Set the attribute as a number
                  });
                }
              } else {
                // For string attributes, directly set the value
                setAttributes({
                  [zlgcbGetResponsiveAttribute(attributes, attributeNames[0])]:
                    value,
                });
              }
            },
          })
        ),
        // Right side: SelectControl for unit of measurement
        el(
          "div",
          {
            style: {
              width: "50%",
            },
          },
          // Render SelectControl for unit of measurement
          zlgcbSelectControl(
            attributes,
            "Unit",
            zlgcbGetResponsiveAttribute(attributes, attributeNames[1]),
            [
              { label: "px", value: "px" },
              { label: "%", value: "%" },
              { label: "em", value: "em" },
              { label: "rem", value: "rem" },
              { label: "vh", value: "vh" },
              { label: "vw", value: "vw" },
            ],
            "",
            setAttributes
          )
        )
      );
    }

    /**
     * Creates a panel row with multiple TextControl inputs for different attributes and a SelectControl for units.
     *
     * @param {object} attributes - The attributes object containing various attribute settings.
     * @param {string} attributeLabel - The label for the main attribute.
     * @param {string} attributeType - The type of the main attribute (e.g., "number", "string").
     * @param {Array<string>} attributeNames - An array containing the base names of the attributes for the main value and its unit.
     * @param {string|null} attributeUnit - The attribute name for the unit of measurement (optional).
     * @param {function} setAttributes - The function to update the attributes.
     *
     * @returns {object} The React element representing the panel row with multiple TextControl and SelectControl components.
     */
    function zlgcbCreateMultipleAttributeControls(
      attributes,
      attributeLabel,
      attributeType,
      attributeNames,
      attributeUnit = null,
      setAttributes
    ) {
      return el(
        PanelRow,
        { className: "zlgcb-custom-panel-row" },
        // Attribute label
        el("strong", { className: "zlgcb-attribute-label" }, attributeLabel),
        el(
          "div",
          {
            className: "zlgcb-multiple-attributes-control",
          },
          // Mapping through each attribute name to create a TextControl
          attributeNames.map((attributeName) =>
            el(TextControl, {
              type: attributeType,
              value:
                attributes[
                  zlgcbGetResponsiveAttribute(attributes, attributeName)
                ], // Ensure value is converted to string
              onChange: function (value) {
                if (attributeType === "number") {
                  const parsedValue = parseFloat(value); // Parse the string value to a float

                  // Check if the parsed value is valid and within limits
                  if (!isNaN(parsedValue)) {
                    setAttributes({
                      [zlgcbGetResponsiveAttribute(attributes, attributeName)]:
                        parsedValue,
                    });
                  }
                } else {
                  setAttributes({
                    [zlgcbGetResponsiveAttribute(attributes, attributeName)]:
                      value,
                  });
                }
              },
            })
          ),
          // Optional: SelectControl for unit of measurement
          attributeUnit &&
            el(
              "div",
              {
                style: {
                  width: "50%",
                },
              },
              zlgcbSelectControl(
                attributes,
                "",
                zlgcbGetResponsiveAttribute(attributes, attributeUnit),
                [
                  { label: "px", value: "px" },
                  { label: "%", value: "%" },
                  { label: "em", value: "em" },
                  { label: "rem", value: "rem" },
                  { label: "vh", value: "vh" },
                  { label: "vw", value: "vw" },
                ],
                "",
                setAttributes
              )
            )
        )
      );
    }

    /**
     * Renders a component conditionally based on the provided condition.
     *
     * @param {boolean} condition - The condition to evaluate for rendering.
     * @param {JSX.Element} component - The component to render if the condition is true.
     * @returns {JSX.Element | null} - Returns the rendered component or null if condition is false.
     */
    function zlgcbConditionalRender(condition, component) {
      return condition ? component : null;
    }

    /**
     * Fetches a list of Google Fonts and passes them to the provided callback function.
     * The function retrieves up to 1000 Google Fonts, maps them to an array of objects
     * containing 'label' and 'value' properties, and invokes the callback with the array.
     * If an error occurs during the fetch, it logs the error and invokes the callback with an empty array.
     *
     * @param {function} callback - The function to call with the array of font options.
     */
    function zlgcbFetchGoogleFonts(callback) {
      fetch(
        "https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyBEdyPl4aQp8zldXY0tIfrroY6kJyUdbAs"
      )
        .then((response) => response.json())
        .then((data) => {
          const fontOptions = data.items.slice(0, 1000).map((font) => ({
            label: font.family,
            value: font.family,
          }));
          callback(fontOptions);
        })
        .catch((error) => {
          console.error("Error fetching Google Fonts:", error);
          callback([]);
        });
    }

    /**
     * Minifies CSS by performing the following operations:
     * 1. Replace multiple spaces with a single space.
     * 2. Remove all CSS comments.
     * 3. Remove spaces around CSS selectors ({}, :, ;, ,).
     * 4. Remove the last semicolon before closing brackets.
     * 5. Trim any leading or trailing whitespace.
     *
     * @param {string} css - The CSS string to be minified.
     *
     * @returns {string} The minified CSS string.
     */
    function zlgcbMinifyCSS(css) {
      return css
        .replace(/\s+/g, " ")
        .replace(/\/\*.*?\*\//g, "")
        .replace(/\s*([{}:;,])\s*/g, "$1")
        .replace(/;}/g, "}")
        .trim();
    }

    // Retrieve the previous layouts from localStorage or initialize an empty object if not available
    let previousLayouts =
      JSON.parse(localStorage.getItem("previousLayouts")) || {};

    /**
     * Function to reset attributes for a new layout if the layout has changed
     * @param {Object} attributes - The attributes object containing style properties
     * @param {string} blockId - The unique ID of the counter block
     */
    function resetAttributesForNewLayout(attributes, blockId) {
      // Check if the layout has changed for this specific block
      if (previousLayouts[blockId] !== attributes.counterLayout) {
        // Reset attributes for specific layouts
        if (
          ["layout2", "layout3", "layout4"].includes(attributes.counterLayout)
        ) {
          // Reset border radius attributes to null
          attributes.boxBorderTRadiusDesktop =
            attributes.boxBorderRRadiusDesktop =
            attributes.boxBorderBRadiusDesktop =
            attributes.boxBorderLRadiusDesktop =
              null;
          attributes.boxBorderRadiusUnitDesktop = "%";

          // Reset other border radius attributes for tablet
          attributes.boxBorderTRadiusTablet =
            attributes.boxBorderRRadiusTablet =
            attributes.boxBorderBRadiusTablet =
            attributes.boxBorderLRadiusTablet =
              null;

          // Reset other border radius attributes for mobile
          attributes.boxBorderTRadiusMobile =
            attributes.boxBorderRRadiusMobile =
            attributes.boxBorderBRadiusMobile =
            attributes.boxBorderLRadiusMobile =
              null;

          // Reset box shadow attributes to null
          attributes.boxBoxshadowHoffsetDesktop =
            attributes.boxBoxshadowVoffsetDesktop =
            attributes.boxBoxshadowBlurDesktop =
            attributes.boxBoxshadowSpreadDesktop =
              null;

          // Reset box shadow attributes to Tablet
          attributes.boxBoxshadowHoffsetTablet =
            attributes.boxBoxshadowVoffsetTablet =
            attributes.boxBoxshadowBlurTablet =
            attributes.boxBoxshadowSpreadTablet =
              null;

          // Reset box shadow attributes for Mobile
          attributes.boxBoxshadowHoffsetMobile =
            attributes.boxBoxshadowVoffsetMobile =
            attributes.boxBoxshadowBlurMobile =
            attributes.boxBoxshadowSpreadMobile =
              null;
        }

        // Update the previous layout to the current one for this specific block
        previousLayouts[blockId] = attributes.counterLayout;
        localStorage.setItem(
          "previousLayouts",
          JSON.stringify(previousLayouts)
        );
      }
    }

    jQuery(document).ready(function ($) {
      // Iterate through each element with the class 'zlgcb-counter-box'
      $(".zlgcb-counter-box").each(function () {
        var $this = $(this);
        var blockId = $this.attr("id"); // Ensure each counter block has a unique ID

        // Define the attributes object with values from data attributes
        var attributes = {
          counterLayout: $this.data("layout"),
          boxBorderTRadiusDesktop: $this.data("boxborderradiusdesktop"),
          boxBorderRRadiusDesktop: $this.data("boxborderradiusdesktop"),
          boxBorderBRadiusDesktop: $this.data("boxborderradiusdesktop"),
          boxBorderLRadiusDesktop: $this.data("boxborderradiusdesktop"),
          boxBorderRadiusUnitDesktop: $this.data("boxborderradiusunitdesktop"),
          boxBorderTRadiusTablet: $this.data("boxborderradiustablet"),
          boxBorderRRadiusTablet: $this.data("boxborderradiustablet"),
          boxBorderBRadiusTablet: $this.data("boxborderradiustablet"),
          boxBorderLRadiusTablet: $this.data("boxborderradiustablet"),
          boxBorderTRadiusMobile: $this.data("boxborderradiusmobile"),
          boxBorderRRadiusMobile: $this.data("boxborderradiusmobile"),
          boxBorderBRadiusMobile: $this.data("boxborderradiusmobile"),
          boxBorderLRadiusMobile: $this.data("boxborderradiusmobile"),
          boxBoxshadowHoffsetDesktop: $this.data("boxboxshadowhoffsetdesktop"),
          boxBoxshadowVoffsetDesktop: $this.data("boxboxshadowvoffsetdesktop"),
          boxBoxshadowBlurDesktop: $this.data("boxboxshadowblurdesktop"),
          boxBoxshadowSpreadDesktop: $this.data("boxboxshadowspreaddesktop"),
          boxBoxshadowHoffsetTablet: $this.data("boxboxshadowhoffsettablet"),
          boxBoxshadowVoffsetTablet: $this.data("boxboxshadowvoffsettablet"),
          boxBoxshadowBlurTablet: $this.data("boxboxshadowblurtablet"),
          boxBoxshadowSpreadTablet: $this.data("boxboxshadowspreadtablet"),
          boxBoxshadowHoffsetMobile: $this.data("boxboxshadowhoffsetmobile"),
          boxBoxshadowVoffsetMobile: $this.data("boxboxshadowvoffsetmobile"),
          boxBoxshadowBlurMobile: $this.data("boxboxshadowblurmobile"),
          boxBoxshadowSpreadMobile: $this.data("boxboxshadowspreadmobile"),
        };

        // Call the function with attributes and the unique block ID
        resetAttributesForNewLayout(attributes, blockId);
      });
    });

    /**
     * Generates dynamic CSS styles based on provided attributes and unique class name.
     *
     * @param {object} attributes - The attributes object containing style properties.
     * @param {string} uniqueClass - The unique class name prefix for CSS specificity.
     *
     * @returns {string} Minified CSS string for dynamic styles.
     */
    function zlgcbGenerateDynamicStyles(attributes, uniqueClass) {
      var blockId = uniqueClass;

      // Call the reset function to ensure it runs only once per layout change
      resetAttributesForNewLayout(attributes, blockId);

      // Check if the current layout is "layout1"
      if (attributes.counterLayout === "layout1") {
        // Helper function to set default values for attributes if they are null or undefined
        const setDefault = (attr, value) => {
          attributes[attr] =
            attributes[attr] !== null && attributes[attr] !== undefined
              ? attributes[attr]
              : value;
        };

        // Set border radius attributes with default values for layout 1
        setDefault("boxBorderTRadiusDesktop", 45);
        setDefault("boxBorderRRadiusDesktop", 0);
        setDefault("boxBorderBRadiusDesktop", 45);
        setDefault("boxBorderLRadiusDesktop", 0);
        setDefault("boxBorderRadiusUnitDesktop", "%");

        // Set box shadow attributes with default values
        setDefault("boxBoxshadowHoffsetDesktop", 15);
        setDefault("boxBoxshadowVoffsetDesktop", 0);
        setDefault("boxBoxshadowBlurDesktop", 50);
        setDefault("boxBoxshadowSpreadDesktop", "-25");
        setDefault("boxBoxshadowColor", "#DF00FF");
      }

      // Check if the current layout is "layout1" and "layout2"
      if (["layout1", "layout2"].includes(attributes.counterLayout)) {
        // Helper function to set default values for attributes if they are null
        const setDefault = (attr, value) => {
          attributes[attr] =
            attributes[attr] !== null ? attributes[attr] : value;
        };

        // Set border width attributes with default values for layouts 1 and 2
        setDefault("boxBorderTDesktop", 5);
        setDefault("boxBorderRDesktop", 0);
        setDefault("boxBorderBDesktop", 5);
        setDefault("boxBorderLDesktop", 0);
        setDefault("boxBorderUnitDesktop", "px");

        // Ensure the box border style is set to solid if it is not set or set to none
        if (
          !attributes.boxBorderStyle ||
          attributes.boxBorderStyle === "none"
        ) {
          attributes.boxBorderStyle = "solid";
        }
      }

      // Initialize initialBorderStyleSet from local storage if available
      let initialBorderStyleSet =
        localStorage.getItem("initialBorderStyleSet") === "true";

      /**
       * Resets border style settings based on the current layout.
       * Ensures that for layouts 3 and 4, the border style is set to "none" unless explicitly set to "solid" by the user.
       * Persists the state of initial border style setting in local storage.
       *
       * @param {object} attributes - The attributes object containing style properties.
       */
      function resetBorderStyleForLayouts(attributes) {
        // Check if the current layout is either layout3 or layout4
        if (["layout3", "layout4"].includes(attributes.counterLayout)) {
          // Set border style to "none" if not already set, and persist this setting
          if (!initialBorderStyleSet) {
            attributes.boxBorderStyle = "none";
            attributes.boxBorderTDesktop =
              attributes.boxBorderRDesktop =
              attributes.boxBorderBDesktop =
              attributes.boxBorderLDesktop =
                null;
            initialBorderStyleSet = true;
            localStorage.setItem("initialBorderStyleSet", "true");
          }

          // If the user has set the border style to "solid", ensure the border widths are set
          if (attributes.boxBorderStyle === "solid") {
            attributes.boxBorderStyle = "solid";

            // Helper function to set border width attributes
            const setBorderWidths = (desktop, tablet, mobile) => {
              attributes[desktop] =
                attributes[desktop] !== null ? attributes[desktop] : 0;
              attributes[tablet] =
                attributes[tablet] !== null ? attributes[tablet] : 0;
              attributes[mobile] =
                attributes[mobile] !== null ? attributes[mobile] : 0;
            };

            setBorderWidths(
              "boxBorderTDesktop",
              "boxBorderTTablet",
              "boxBorderTMobile"
            );
            setBorderWidths(
              "boxBorderRDesktop",
              "boxBorderRTablet",
              "boxBorderRMobile"
            );
            setBorderWidths(
              "boxBorderBDesktop",
              "boxBorderBTablet",
              "boxBorderBMobile"
            );
            setBorderWidths(
              "boxBorderLDesktop",
              "boxBorderLTablet",
              "boxBorderLMobile"
            );
          }
        } else {
          // Reset the flag when switching to other layouts
          initialBorderStyleSet = false;
          // Persist the updated value of initialBorderStyleSet in local storage for future reference
          localStorage.setItem("initialBorderStyleSet", "false");
        }
      }

      // Call the function with your attributes object
      resetBorderStyleForLayouts(attributes);

      // Constructing the CSS styles using template literals
      const styles = `
        @import url('https://fonts.googleapis.com/css?family=${
          attributes.counterLabelFontFamily
        }');

        @import url('https://fonts.googleapis.com/css?family=${
          attributes.counterNumberFontFamily
        }');
          
        .${uniqueClass}.zlgcb-counter-box {

          background-color: ${attributes.backgroundColor};

          ${
            // Check if any padding attribute is defined for the desktop view
            attributes.boxTPaddingDesktop ||
            attributes.boxRPaddingDesktop ||
            attributes.boxBPaddingDesktop ||
            attributes.boxLPaddingDesktop
              ? `
                padding:  ${attributes.boxTPaddingDesktop}${attributes.boxPaddingUnitDesktop}
                          ${attributes.boxRPaddingDesktop}${attributes.boxPaddingUnitDesktop}
                          ${attributes.boxBPaddingDesktop}${attributes.boxPaddingUnitDesktop}
                          ${attributes.boxLPaddingDesktop}${attributes.boxPaddingUnitDesktop};
              `
              : ""
          }
          
          ${
            // Check if any padding attribute is defined for the desktop view
            attributes.boxBorderStyle != "none"
              ? `
                border-width: ${attributes.boxBorderTDesktop}${attributes.boxBorderUnitDesktop}
                              ${attributes.boxBorderRDesktop}${attributes.boxBorderUnitDesktop}
                              ${attributes.boxBorderBDesktop}${attributes.boxBorderUnitDesktop}
                              ${attributes.boxBorderLDesktop}${attributes.boxBorderUnitDesktop};
                border-color: ${attributes.boxBorderColor};
                border-style: ${attributes.boxBorderStyle};
              `
              : ""
          }

          ${
            // Conditional check for box shadow
            attributes.boxBoxshadowColor
              ? `
                box-shadow: ${attributes.boxBoxshadowHoffsetDesktop}${attributes.boxBoxshadowUnitDesktop}
                            ${attributes.boxBoxshadowVoffsetDesktop}${attributes.boxBoxshadowUnitDesktop}
                            ${attributes.boxBoxshadowBlurDesktop}${attributes.boxBoxshadowUnitDesktop}
                            ${attributes.boxBoxshadowSpreadDesktop}${attributes.boxBoxshadowUnitDesktop}
                            ${attributes.boxBoxshadowColor};
              `
              : ""
          }

          ${
            // Conditional check for background image
            attributes.boxBackgroundImage
              ? `
                background-image: url('${attributes.boxBackgroundImage}');
                background-position: ${attributes.boxBackgroundImagePositionDesktop};
                background-attachment: ${attributes.boxBackgroundImageAttachment};
                background-repeat: ${attributes.boxBackgroundImageRepeat};
                background-size: ${attributes.boxBackgroundImageDisplaySizeDesktop};
              `
              : ""
          }

          ${
            // Check if any Border Radius attribute is defined for the desktop view
            attributes.boxBorderTRadiusDesktop ||
            attributes.boxBorderRRadiusDesktop ||
            attributes.boxBorderBRadiusDesktop ||
            attributes.boxBorderLRadiusDesktop
              ? `
                border-radius:  ${attributes.boxBorderTRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop}
                                ${attributes.boxBorderRRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop}
                                ${attributes.boxBorderBRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop}
                                ${attributes.boxBorderLRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop};
              `
              : ""
          }
        }
            
        ${
          // Conditional check for layout-1 counter layout
          attributes.counterLayout === "layout1"
            ? `
            .zlgcb-circle-container {
              position: relative;
              width: 100%;
              max-width: 150px;
              aspect-ratio: 1 / 1;
              border-radius: 50%;
              margin: 0 auto;
              overflow: hidden;
            }

            .zlgcb-circle-fill {
              background-image: linear-gradient(90deg, transparent 50%, white 50%),
                linear-gradient(90deg, white 50%, transparent 50%);
            }

            .zlgcb-counter-number-layout-1 h2{
              position: absolute;
              left: 9px;
              top: 9px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
              width: calc(100% - 20px);
              height: calc(100% - 20px);
              border-radius: 50%;
            }

            .${uniqueClass} .zlgcb-counter-number-layout-1 {
              margin: 20px auto 20px;
            }

            .${uniqueClass} .zlgcb-counter-number-layout-1 h2{
              background-color: ${attributes.counterNumberBgColor};
              border: 2px solid ${attributes.counterNumberLoaderColor};
            }
          `
            : ""
        }

        ${
          // Conditional check for layout-3 counter layout
          attributes.counterLayout === "layout3"
            ? `
            .${uniqueClass}.zlgcb-counter-box.zlgcb-counter-box-layout-3 {
              position: relative;
              z-index: 1;
              padding: 0;
            }

            .${uniqueClass}.zlgcb-counter-box-layout-3::before,
            .${uniqueClass}.zlgcb-counter-box-layout-3::after {
              content: "";
              background: linear-gradient(135deg, ${
                attributes.counterLabelColor
              } 45%, rgba(0,0,0,1) 100%);
              position: absolute;
              top: 10px;
              left: 10px;
              right: 0;
              bottom: 0;
              z-index: -1;
              height: calc(100% + 10px);
              width: calc(100% + 10px);

              ${
                attributes.boxBorderTRadiusDesktop ||
                attributes.boxBorderRRadiusDesktop ||
                attributes.boxBorderBRadiusDesktop ||
                attributes.boxBorderLRadiusDesktop
                  ? `
                    border-radius: ${attributes.boxBorderTRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop}
                        ${attributes.boxBorderRRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop}
                        ${attributes.boxBorderBRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop}
                        ${attributes.boxBorderLRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop};
                  `
                  : ""
              }
            }

            .${uniqueClass}.zlgcb-counter-box-layout-3:after {
              background: transparent;
              border: 2px dashed rgba(255,255,255,0.5);
              top: -2px;
              left: -3px;
            }

            .${uniqueClass} .zlgcb-counter-data-layout-3 {
              position: relative;
              background-color: ${attributes.backgroundColor};
              height: 100%;
              padding:  ${attributes.boxTPaddingDesktop}${
                attributes.boxPaddingUnitDesktop
              }
                        ${attributes.boxRPaddingDesktop}${
                attributes.boxPaddingUnitDesktop
              }
                        ${attributes.boxBPaddingDesktop}${
                attributes.boxPaddingUnitDesktop
              }
                        ${attributes.boxLPaddingDesktop}${
                attributes.boxPaddingUnitDesktop
              };

              ${
                // Check if any Border Radius attribute is defined for the desktop view
                attributes.boxBorderTRadiusDesktop ||
                attributes.boxBorderRRadiusDesktop ||
                attributes.boxBorderBRadiusDesktop ||
                attributes.boxBorderLRadiusDesktop
                  ? `
                    border-radius:  ${attributes.boxBorderTRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop}
                                    ${attributes.boxBorderRRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop}
                                    ${attributes.boxBorderBRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop}
                                    ${attributes.boxBorderLRadiusDesktop}${attributes.boxBorderRadiusUnitDesktop};
                  `
                  : ""
              }

              ${
                // Conditional check for background image
                attributes.boxBackgroundImage
                  ? `
                    background-image: url('${attributes.boxBackgroundImage}');
                    background-position: ${attributes.boxBackgroundImagePositionDesktop};
                    background-attachment: ${attributes.boxBackgroundImageAttachment};
                    background-repeat: ${attributes.boxBackgroundImageRepeat};
                    background-size: ${attributes.boxBackgroundImageDisplaySizeDesktop};
                  `
                  : ""
              }
            }

            ${
              !attributes.boxBorderTRadiusDesktop ||
              !attributes.boxBorderRRadiusDesktop ||
              !attributes.boxBorderBRadiusDesktop ||
              !attributes.boxBorderLRadiusDesktop
                ? `
                  .${uniqueClass} .zlgcb-counter-data-layout-3:before,
                  .${uniqueClass} .zlgcb-counter-data-layout-3:after {
                    content: '';
                    background: linear-gradient(to top right, #050006 50%, transparent 52%);
                    height: 10px;
                    width: 10px;
                    position: absolute;
                    right: -10px;
                    top: 0;
                  }
                `
                : ""
            }

            .${uniqueClass} .zlgcb-counter-data-layout-3:after {
              transform: rotate(180deg);
              top: auto;
              bottom: -10px;
              right: auto;
              left: 0;
            }
          `
            : ""
        }
            
        ${
          // Conditional check for image URL
          attributes.imageUrl
            ? `
            .${uniqueClass} .zlgcb-counter-img {
              display: block;
              margin: 0 auto 10px;
              width: ${attributes.imageWidthDesktop}${
                attributes.imageWidthUnitDesktop
              };
              height: ${attributes.imageHeightDesktop}${
                attributes.imageHeightUnitDesktop
              };
              object-fit: ${attributes.imageDisplaySizeDesktop};

              ${
                // Conditional check for Image Border Radius
                attributes.imageBorderTRadiusDesktop ||
                attributes.imageBorderRRadiusDesktop ||
                attributes.imageBorderBRadiusDesktop ||
                attributes.imageBorderLRadiusDesktop
                  ? `
                    border-radius:  ${attributes.imageBorderTRadiusDesktop}${attributes.imageBorderRadiusUnitDesktop} 
                                    ${attributes.imageBorderRRadiusDesktop}${attributes.imageBorderRadiusUnitDesktop} 
                                    ${attributes.imageBorderBRadiusDesktop}${attributes.imageBorderRadiusUnitDesktop} 
                                    ${attributes.imageBorderLRadiusDesktop}${attributes.imageBorderRadiusUnitDesktop};
                  `
                  : ""
              }

              ${
                // Conditional check for Image Border
                attributes.imageBorderTDesktop ||
                attributes.imageBorderRDesktop ||
                attributes.imageBorderBDesktop ||
                attributes.imageBorderLDesktop
                  ? `
                    border-width: ${attributes.imageBorderTDesktop}${attributes.imageBorderUnitDesktop} 
                                  ${attributes.imageBorderRDesktop}${attributes.imageBorderUnitDesktop} 
                                  ${attributes.imageBorderBDesktop}${attributes.imageBorderUnitDesktop} 
                                  ${attributes.imageBorderLDesktop}${attributes.imageBorderUnitDesktop};
                  `
                  : ""
              }

              ${
                attributes.imageBorderColor
                  ? ` 
                    border-color: ${attributes.imageBorderColor};
                  `
                  : ""
              }
                  
              border-style: ${attributes.imageBorderStyle};
            }
          `
            : ""
        }

        .zlgcb-counter-number {
          margin: 0 0 15px;
        }
        
        .${uniqueClass} .zlgcb-counter-number {
          font-family: ${attributes.counterNumberFontFamily};
          font-size: ${attributes.counterNumberFontSizeDesktop}${
        attributes.counterNumberFontSizeUnitDesktop
      };
          line-height: ${attributes.counterNumberFontLineHeightDesktop}${
        attributes.counterNumberFontLineHeightUnitDesktop
      };
          font-weight: ${attributes.counterNumberFontWeight};
          font-style: ${attributes.counterNumberFontStyle};
          text-align: ${attributes.counterNumberFontAlignDesktop};
          color: ${attributes.counterNumberColor};
        }

        .zlgcb-counter-label {
          margin: 0 !important;
        }
        
        .${uniqueClass} .zlgcb-counter-label {
          font-family: ${attributes.counterLabelFontFamily};
          font-size: ${attributes.counterLabelFontSizeDesktop}${
        attributes.counterLabelFontSizeUnitDesktop
      };
          line-height: ${attributes.counterLabelFontLineHeightDesktop}${
        attributes.counterLabelFontLineHeightUnitDesktop
      };
          text-align: ${attributes.counterLabelFontAlignDesktop};
          font-weight: ${attributes.counterLabelFontWeight};
          font-style: ${attributes.counterLabelFontStyle};
          text-transform: ${attributes.counterLabelFontTextTransform};
          color: ${attributes.counterLabelColor};
        }

      @media (max-width: 1024px) {

        .${uniqueClass}.zlgcb-counter-box {
          ${
            // Conditional check for Tablet Box Padding
            attributes.boxTPaddingTablet ||
            attributes.boxRPaddingTablet ||
            attributes.boxBPaddingTablet ||
            attributes.boxLPaddingTablet
              ? `
                padding:  ${attributes.boxTPaddingTablet}${attributes.boxPaddingUnitTablet}
                          ${attributes.boxRPaddingTablet}${attributes.boxPaddingUnitTablet}
                          ${attributes.boxBPaddingTablet}${attributes.boxPaddingUnitTablet}
                          ${attributes.boxLPaddingTablet}${attributes.boxPaddingUnitTablet};
              `
              : ""
          }
          
          ${
            // Conditional check for Tablet Box Border
            attributes.boxBorderTTablet ||
            attributes.boxBorderRTablet ||
            attributes.boxBorderBTablet ||
            attributes.boxBorderLTablet
              ? `
                border-width: ${attributes.boxBorderTTablet}${attributes.boxBorderUnitTablet}
                              ${attributes.boxBorderRTablet}${attributes.boxBorderUnitTablet}
                              ${attributes.boxBorderBTablet}${attributes.boxBorderUnitTablet}
                              ${attributes.boxBorderLTablet}${attributes.boxBorderUnitTablet};
              `
              : ""
          }

          ${
            // Conditional check for box shadow
            attributes.boxBoxshadowHoffsetTablet ||
            attributes.boxBoxshadowVoffsetTablet ||
            attributes.boxBoxshadowBlurTablet ||
            attributes.boxBoxshadowSpreadTablet
              ? `
                box-shadow: ${attributes.boxBoxshadowHoffsetTablet}${attributes.boxBoxshadowUnitTablet}
                            ${attributes.boxBoxshadowVoffsetTablet}${attributes.boxBoxshadowUnitTablet}
                            ${attributes.boxBoxshadowBlurTablet}${attributes.boxBoxshadowUnitTablet}
                            ${attributes.boxBoxshadowSpreadTablet}${attributes.boxBoxshadowUnitTablet}
                            ${attributes.boxBoxshadowColor};
              `
              : ""
          }

          ${
            // Conditional check for background image
            attributes.boxBackgroundImage
              ? `
                background-position: ${attributes.boxBackgroundImagePositionTablet};
                background-size: ${attributes.boxBackgroundImageDisplaySizeTablet};
              `
              : ""
          }

          ${
            // Conditional check for Tablet Box Border Radius
            attributes.boxBorderTRadiusTablet ||
            attributes.boxBorderRRadiusTablet ||
            attributes.boxBorderBRadiusTablet ||
            attributes.boxBorderLRadiusTablet
              ? `
                border-radius:  ${attributes.boxBorderTRadiusTablet}${attributes.boxBorderRadiusUnitTablet}
                                ${attributes.boxBorderRRadiusTablet}${attributes.boxBorderRadiusUnitTablet}
                                ${attributes.boxBorderBRadiusTablet}${attributes.boxBorderRadiusUnitTablet}
                                ${attributes.boxBorderLRadiusTablet}${attributes.boxBorderRadiusUnitTablet};
              `
              : ""
          }
        }

        .${uniqueClass} .zlgcb-counter-data-layout-3 {
          ${
            // Conditional check for Tablet Box Padding
            attributes.boxTPaddingTablet ||
            attributes.boxRPaddingTablet ||
            attributes.boxBPaddingTablet ||
            attributes.boxLPaddingTablet
              ? `
                padding:  ${attributes.boxTPaddingTablet}${attributes.boxPaddingUnitTablet}
                          ${attributes.boxRPaddingTablet}${attributes.boxPaddingUnitTablet}
                          ${attributes.boxBPaddingTablet}${attributes.boxPaddingUnitTablet}
                          ${attributes.boxLPaddingTablet}${attributes.boxPaddingUnitTablet};
              `
              : ""
          }

          ${
            // Conditional check for Tablet Box Border Radius
            attributes.boxBorderTRadiusTablet ||
            attributes.boxBorderRRadiusTablet ||
            attributes.boxBorderBRadiusTablet ||
            attributes.boxBorderLRadiusTablet
              ? `
              border-radius: ${attributes.boxBorderTRadiusTablet}${attributes.boxBorderRadiusUnitTablet}
                  ${attributes.boxBorderRRadiusTablet}${attributes.boxBorderRadiusUnitTablet}
                  ${attributes.boxBorderBRadiusTablet}${attributes.boxBorderRadiusUnitTablet}
                  ${attributes.boxBorderLRadiusTablet}${attributes.boxBorderRadiusUnitTablet};
              `
              : ""
          }

          ${
            // Conditional check for background image
            attributes.boxBackgroundImage
              ? `
                background-position: ${attributes.boxBackgroundImagePositionTablet};
                background-size: ${attributes.boxBackgroundImageDisplaySizeTablet};
              `
              : ""
          }
        }

        ${
          // Conditional check for image URL
          attributes.imageUrl
            ? `
            .${uniqueClass} .zlgcb-counter-img {
              width: ${attributes.imageWidthTablet}${
                attributes.imageWidthUnitTablet
              };
              height: ${attributes.imageHeightTablet}${
                attributes.imageHeightUnitTablet
              };
              object-fit: ${attributes.imageDisplaySizeTablet};

              ${
                // Conditional check for Tablet Image Border Radius
                attributes.imageBorderTRadiusTablet ||
                attributes.imageBorderRRadiusTablet ||
                attributes.imageBorderBRadiusTablet ||
                attributes.imageBorderLRadiusTablet
                  ? `
                    border-radius:  ${attributes.imageBorderTRadiusTablet}${attributes.imageBorderRadiusUnitTablet} 
                                    ${attributes.imageBorderRRadiusTablet}${attributes.imageBorderRadiusUnitTablet} 
                                    ${attributes.imageBorderBRadiusTablet}${attributes.imageBorderRadiusUnitTablet} 
                                    ${attributes.imageBorderLRadiusTablet}${attributes.imageBorderRadiusUnitTablet};
                  `
                  : ""
              }

              ${
                // Conditional check for Tablet Image Border
                attributes.imageBorderTTablet ||
                attributes.imageBorderRTablet ||
                attributes.imageBorderBTablet ||
                attributes.imageBorderLTablet
                  ? `
                    border-width: ${attributes.imageBorderTTablet}${attributes.imageBorderUnitTablet} 
                                  ${attributes.imageBorderRTablet}${attributes.imageBorderUnitTablet} 
                                  ${attributes.imageBorderBTablet}${attributes.imageBorderUnitTablet} 
                                  ${attributes.imageBorderLTablet}${attributes.imageBorderUnitTablet};
                  `
                  : ""
              }
            }
            `
            : ""
        }

        .${uniqueClass} .zlgcb-counter-number {
          font-size: ${attributes.counterNumberFontSizeTablet}${
        attributes.counterNumberFontSizeUnitTablet
      };
          line-height: ${attributes.counterNumberFontLineHeightTablet}${
        attributes.counterNumberFontLineHeightUnitTablet
      };
          text-align: ${attributes.counterNumberFontAlignTablet};
        }

        .${uniqueClass} .zlgcb-counter-label {
          font-size: ${attributes.counterLabelFontSizeTablet}${
        attributes.counterLabelFontSizeUnitTablet
      };
          line-height: ${attributes.counterLabelFontLineHeightTablet}${
        attributes.counterLabelFontLineHeightUnitTablet
      };
          text-align: ${attributes.counterLabelFontAlignTablet};
        }

      }
        
      @media (max-width: 767px) {

        .${uniqueClass}.zlgcb-counter-box {

          ${
            // Conditional check for Mobile Box Padding
            attributes.boxTPaddingMobile ||
            attributes.boxRPaddingMobile ||
            attributes.boxBPaddingMobile ||
            attributes.boxLPaddingMobile
              ? `
                padding:  ${attributes.boxTPaddingMobile}${attributes.boxPaddingUnitMobile}
                          ${attributes.boxRPaddingMobile}${attributes.boxPaddingUnitMobile}
                          ${attributes.boxBPaddingMobile}${attributes.boxPaddingUnitMobile}
                          ${attributes.boxLPaddingMobile}${attributes.boxPaddingUnitMobile};
                `
              : ""
          }
          
          ${
            // Conditional check for Mobile Box Border
            attributes.boxBorderTMobile ||
            attributes.boxBorderRMobile ||
            attributes.boxBorderBMobile ||
            attributes.boxBorderLMobile
              ? `
                border-width: ${attributes.boxBorderTMobile}${attributes.boxBorderUnitMobile}
                              ${attributes.boxBorderRMobile}${attributes.boxBorderUnitMobile}
                              ${attributes.boxBorderBMobile}${attributes.boxBorderUnitMobile}
                              ${attributes.boxBorderLMobile}${attributes.boxBorderUnitMobile};
                `
              : ""
          }

          ${
            // Conditional check for Mobile box shadow
            attributes.boxBoxshadowHoffsetMobile ||
            attributes.boxBoxshadowVoffsetMobile ||
            attributes.boxBoxshadowBlurMobile ||
            attributes.boxBoxshadowSpreadMobile
              ? `
                box-shadow: ${attributes.boxBoxshadowHoffsetMobile}${attributes.boxBoxshadowUnitMobile}
                            ${attributes.boxBoxshadowVoffsetMobile}${attributes.boxBoxshadowUnitMobile}
                            ${attributes.boxBoxshadowBlurMobile}${attributes.boxBoxshadowUnitMobile}
                            ${attributes.boxBoxshadowSpreadMobile}${attributes.boxBoxshadowUnitMobile}
                            ${attributes.boxBoxshadowColor};
                `
              : ""
          }

          ${
            // Conditional check for Mobile background image
            attributes.boxBackgroundImage
              ? `
                  background-position: ${attributes.boxBackgroundImagePositionMobile};
                  background-size: ${attributes.boxBackgroundImageDisplaySizeMobile};
                  `
              : ""
          }

          ${
            // Conditional check for Mobile Box Border Radius
            attributes.boxBorderTRadiusMobile ||
            attributes.boxBorderRRadiusMobile ||
            attributes.boxBorderBRadiusMobile ||
            attributes.boxBorderLRadiusMobile
              ? `
                border-radius:  ${attributes.boxBorderTRadiusMobile}${attributes.boxBorderRadiusUnitMobile}
                                ${attributes.boxBorderRRadiusMobile}${attributes.boxBorderRadiusUnitMobile}
                                ${attributes.boxBorderBRadiusMobile}${attributes.boxBorderRadiusUnitMobile}
                                ${attributes.boxBorderLRadiusMobile}${attributes.boxBorderRadiusUnitMobile};
              `
              : ""
          }
        }

        .${uniqueClass} .zlgcb-counter-data-layout-3 {
          ${
            // Conditional check for Mobile Box Padding
            attributes.boxTPaddingMobile ||
            attributes.boxRPaddingMobile ||
            attributes.boxBPaddingMobile ||
            attributes.boxLPaddingMobile
              ? `
                padding: ${attributes.boxTPaddingMobile}${attributes.boxPaddingUnitMobile}
                      ${attributes.boxRPaddingMobile}${attributes.boxPaddingUnitMobile}
                      ${attributes.boxBPaddingMobile}${attributes.boxPaddingUnitMobile}
                      ${attributes.boxLPaddingMobile}${attributes.boxPaddingUnitMobile};
              `
              : ""
          }

          ${
            // Conditional check for Mobile Box Border Radius
            attributes.boxBorderTRadiusMobile ||
            attributes.boxBorderRRadiusMobile ||
            attributes.boxBorderBRadiusMobile ||
            attributes.boxBorderLRadiusMobile
              ? `
                border-radius:  ${attributes.boxBorderTRadiusMobile}${attributes.boxBorderRadiusUnitMobile}
                                ${attributes.boxBorderRRadiusMobile}${attributes.boxBorderRadiusUnitMobile}
                                ${attributes.boxBorderBRadiusMobile}${attributes.boxBorderRadiusUnitMobile}
                                ${attributes.boxBorderLRadiusMobile}${attributes.boxBorderRadiusUnitMobile};
              `
              : ""
          }

          ${
            // Conditional check for background image
            attributes.boxBackgroundImage
              ? `
                background-position: ${attributes.boxBackgroundImagePositionMobile};
                background-size: ${attributes.boxBackgroundImageDisplaySizeMobile};
              `
              : ""
          }
        }

        ${
          // Conditional check for image URL
          attributes.imageUrl
            ? `
              .${uniqueClass} .zlgcb-counter-img {
                width: ${attributes.imageWidthMobile}${
                attributes.imageWidthUnitMobile
              };
                height: ${attributes.imageHeightMobile}${
                attributes.imageHeightUnitMobile
              };
                object-fit: ${attributes.imageDisplaySizeMobile};

                ${
                  attributes.imageBorderTRadiusMobile ||
                  attributes.imageBorderRRadiusMobile ||
                  attributes.imageBorderBRadiusMobile ||
                  attributes.imageBorderLRadiusMobile
                    ? `
                      border-radius:  ${attributes.imageBorderTRadiusMobile}${attributes.imageBorderRadiusUnitMobile} 
                                      ${attributes.imageBorderRRadiusMobile}${attributes.imageBorderRadiusUnitMobile} 
                                      ${attributes.imageBorderBRadiusMobile}${attributes.imageBorderRadiusUnitMobile} 
                                      ${attributes.imageBorderLRadiusMobile}${attributes.imageBorderRadiusUnitMobile};
                    `
                    : ""
                }

                ${
                  // Conditional check for Mobile Image Border Radius
                  attributes.imageBorderTMobile ||
                  attributes.imageBorderRMobile ||
                  attributes.imageBorderBMobile ||
                  attributes.imageBorderLMobile
                    ? `
                      border-width: ${attributes.imageBorderTMobile}${attributes.imageBorderUnitMobile} 
                                    ${attributes.imageBorderRMobile}${attributes.imageBorderUnitMobile} 
                                    ${attributes.imageBorderBMobile}${attributes.imageBorderUnitMobile} 
                                    ${attributes.imageBorderLMobile}${attributes.imageBorderUnitMobile};
                    `
                    : ""
                }
              }
            `
            : ""
        }

        .${uniqueClass} .zlgcb-counter-number {
          font-size: ${attributes.counterNumberFontSizeMobile}${
        attributes.counterNumberFontSizeUnitMobile
      };
          line-height: ${attributes.counterNumberFontLineHeightMobile}${
        attributes.counterNumberFontLineHeightUnitMobile
      };
          text-align:${attributes.counterNumberFontAlignMobile};
        }

        .${uniqueClass} .zlgcb-counter-label {
          font-size: ${attributes.counterLabelFontSizeMobile}${
        attributes.counterLabelFontSizeUnitMobile
      };
          line-height: ${attributes.counterLabelFontLineHeightMobile}${
        attributes.counterLabelFontLineHeightUnitMobile
      };
          text-align: ${attributes.counterLabelFontAlignMobile};
        }
      }
      `;

      const minifiedStyles = zlgcbMinifyCSS(styles);
      return minifiedStyles;
    }

    /**
     * Injects dynamic CSS styles into the document head.
     * @param {object} attributes - Object containing style attributes for customization.
     * @param {string} uniqueClass - Unique class name used for CSS specificity.
     */
    function zlgcbInjectDynamicStyles(attributes, uniqueClass) {
      // Retrieve existing style tag by class name
      let styleTag = document.getElementsByClassName("dynamic-counter-styles");

      // Check if style tag doesn't exist
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.className = "dynamic-counter-styles"; // Assign class name to style tag
        document.head.appendChild(styleTag); // Append style tag to document head
      }

      // Generate dynamic CSS styles using zlgcbGenerateDynamicStyles function and inject into style tag
      styleTag.innerHTML = zlgcbGenerateDynamicStyles(attributes, uniqueClass);
    }

    /**
     * Constructs a preview of counter data with dynamic HTML and CSS.
     * @param {object} attributes - Object containing attributes for counter customization.
     * @param {string} uniqueClass - Unique class name used for CSS specificity.
     *
     * @returns {HTMLElement} - Constructed HTML element representing the counter preview.
     */
    function zlgcbPreviewData(attributes, uniqueClass) {
      // Construct a <div> element with class "counter", applying styles and data attributes
      return el(
        "div",
        {
          className: `zlgcb-counter-box ${
            attributes.boxAnimation !== "none"
              ? `zlgcb-animate ${attributes.boxAnimation}`
              : ""
          } ${
            {
              layout1: "zlgcb-counter-box-layout-1",
              layout2: "zlgcb-counter-box-layout-2",
              layout3: "zlgcb-counter-box-layout-3",
              layout4: "zlgcb-counter-box-layout-4",
            }[attributes.counterLayout] || ""
          } ${uniqueClass}`,
          "data-start": attributes.start,
          "data-end": attributes.end,
          "data-duration": attributes.duration,
          "data-prefix": attributes.counterNumberPrefix,
          "data-suffix": attributes.counterNumberSuffix,
          "data-counternumberloadercolor": attributes.counterNumberLoaderColor,
        },

        // Construct a <div> element for counter number display
        el(
          "div",
          {
            className:
              {
                layout1: "zlgcb-counter-data-layout-1",
                layout2: "zlgcb-counter-data-layout-2",
                layout3: "zlgcb-counter-data-layout-3",
                layout4: "zlgcb-counter-data-layout-4",
              }[attributes.counterLayout] || "",
          },

          // Conditionally add an <img> element if imageUrl exists in attributes
          attributes.imageUrl &&
            el(
              "div",
              {
                className: "zlgcb-counter-img-container",
              },

              el("img", {
                src: attributes.imageUrl,
                className: "zlgcb-counter-img",
              })
            ),

          el(
            "div",
            {
              className:
                {
                  layout1:
                    "zlgcb-counter-number-layout-1 zlgcb-circle-container zlgcb-circle-fill",
                  layout2: "zlgcb-counter-number-layout-2",
                  layout3: "zlgcb-counter-number-layout-3",
                  layout4: "zlgcb-counter-number-layout-4",
                }[attributes.counterLayout] || "",

              style:
                attributes.counterLayout === "layout1"
                  ? {
                      backgroundColor: attributes.counterNumberLoaderColor,
                      border: `2px solid ${attributes.counterNumberLoaderColor}`,
                    }
                  : {},
            },
            el(
              "h2",
              {
                className: "zlgcb-counter-number",
              },
              // Display formatted counter number with  prefix, end value, and suffix
              attributes.counterNumberPrefix +
                " " +
                attributes.end + // Show the end number
                " " +
                attributes.counterNumberSuffix
            )
          ),

          el(
            "div",
            {
              className:
                {
                  layout1: "zlgcb-counter-label-layout-1",
                  layout2: "zlgcb-counter-label-layout-2",
                  layout3: "zlgcb-counter-label-layout-3",
                  layout4: "zlgcb-counter-label-layout-4",
                }[attributes.counterLayout] || "",
            },
            el(
              "h3",
              {
                className: "zlgcb-counter-label",
              },
              attributes.counterLabel
            )
          ),

          // Append dynamically generated CSS styles using a <style> element with class "dynamic-counter-styles"
          el(
            "style",
            { className: "dynamic-counter-styles" },
            zlgcbGenerateDynamicStyles(attributes, uniqueClass) // Generate and insert dynamic CSS styles
          )
        )
      );
    }

    // Create the SVG icon using the provided SVG paths
    const svgIcon = el(
      SVG,
      { width: 24, height: 24, viewBox: "-2 0 30 30" },
      el(Path, {
        transform: "translate(-519.000000, -360.000000)",
        d: "M533,374.184 L533,369 C533,368.448 532.553,368 532,368 C531.447,368 531,368.448 531,369 L531,374.184 C529.838,374.597 529,375.695 529,377 C529,378.657 530.343,380 532,380 C533.657,380 535,378.657 535,377 C535,375.695 534.162,374.597 533,374.184 L533,374.184 Z M532,388 C525.925,388 521,383.075 521,377 C521,370.925 525.925,366 532,366 C538.075,366 543,370.925 543,377 C543,383.075 538.075,388 532,388 L532,388 Z M532.99,364.05 C532.991,364.032 533,364.018 533,364 L533,362 L537,362 C537.553,362 538,361.553 538,361 C538,360.447 537.553,360 537,360 L527,360 C526.447,360 526,360.447 526,361 C526,361.553 526.447,362 527,362 L531,362 L531,364 C531,364.018 531.009,364.032 531.01,364.05 C524.295,364.558 519,370.154 519,377 C519,384.18 524.82,390 532,390 C539.18,390 545,384.18 545,377 C545,370.154 539.705,364.558 532.99,364.05 L532.99,364.05 Z",
      })
    );

    // Register a new block type
    blocks.registerBlockType("zlgcb-counter/block", {
      title: "Animated Counter Block", // Block title
      icon: svgIcon,
      category: "common", // Block category
      example: {},
      attributes: {
        // Block attributes
        ...zlgcbCreateAttributes("counterLabel", "string", "Counter"),
        ...zlgcbCreateAttributes("start", "number", 0),
        ...zlgcbCreateAttributes("end", "number", 100),
        ...zlgcbCreateAttributes("duration", "number", 2000),
        ...zlgcbCreateAttributes("counterNumberPrefix", "string", ""),
        ...zlgcbCreateAttributes("counterNumberSuffix", "string", "+"),
        ...zlgcbCreateAttributes("counterLayout", "string", "layout1"),
        ...zlgcbCreateAttributes(
          "counterNumberResponsive",
          "string",
          "desktop"
        ),
        ...zlgcbCreateAttributes("counterNumberFontFamily", "string", "Roboto"),
        ...zlgcbCreateResponsiveAttributes("counterNumberFontSize", "number", {
          desktop: 36,
          tablet: 30,
          mobile: 24,
        }),
        ...zlgcbCreateResponsiveAttributes(
          "counterNumberFontSizeUnit",
          "string",
          {
            desktop: "px",
            tablet: "px",
            mobile: "px",
          }
        ),
        ...zlgcbCreateResponsiveAttributes(
          "counterNumberFontLineHeight",
          "number",
          {
            desktop: 1,
            tablet: 1,
            mobile: 1,
          }
        ),
        ...zlgcbCreateResponsiveAttributes(
          "counterNumberFontLineHeightUnit",
          "string",
          {
            desktop: "em",
            tablet: "em",
            mobile: "em",
          }
        ),
        ...zlgcbCreateAttributes("counterNumberFontWeight", "string", "500"),
        ...zlgcbCreateAttributes("counterNumberFontStyle", "string", "normal"),
        ...zlgcbCreateResponsiveAttributes("counterNumberFontAlign", "string", {
          desktop: "center",
          tablet: "center",
          mobile: "center",
        }),
        ...zlgcbCreateAttributes("counterNumberColor", "string", "#df00ff"),
        ...zlgcbCreateAttributes("counterNumberBgColor", "string", "#ffffff"),
        ...zlgcbCreateAttributes(
          "counterNumberLoaderColor",
          "string",
          "#df00ff"
        ),
        ...zlgcbCreateAttributes("counterLabelFontFamily", "string", "lato"),
        ...zlgcbCreateResponsiveAttributes("counterLabelFontSize", "number", {
          desktop: 36,
          tablet: 30,
          mobile: 24,
        }),
        ...zlgcbCreateResponsiveAttributes(
          "counterLabelFontSizeUnit",
          "string",
          {
            desktop: "px",
            tablet: "px",
            mobile: "px",
          }
        ),
        ...zlgcbCreateResponsiveAttributes(
          "counterLabelFontLineHeight",
          "number",
          {
            desktop: 1,
            tablet: 1,
            mobile: 1,
          }
        ),
        ...zlgcbCreateResponsiveAttributes(
          "counterLabelFontLineHeightUnit",
          "string",
          {
            desktop: "em",
            tablet: "em",
            mobile: "em",
          }
        ),
        ...zlgcbCreateAttributes("counterLabelFontWeight", "string", "500"),
        ...zlgcbCreateAttributes("counterLabelFontStyle", "string", "normal"),
        ...zlgcbCreateResponsiveAttributes("counterLabelFontAlign", "string", {
          desktop: "center",
          tablet: "center",
          mobile: "center",
        }),
        ...zlgcbCreateAttributes(
          "counterLabelFontTextTransform",
          "string",
          "none"
        ),
        ...zlgcbCreateAttributes("counterLabelColor", "string", "#df00ff"),
        ...zlgcbCreateAttributes("backgroundColor", "string", "#fff"),
        ...zlgcbCreateResponsiveAttributes("boxBorderTRadius", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBorderLRadius", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBorderBRadius", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBorderRRadius", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBorderRadiusUnit", "string", {
          desktop: "%",
          tablet: "%",
          mobile: "%",
        }),
        ...zlgcbCreateAttributes("boxBorderStyle", "string"),
        ...zlgcbCreateResponsiveAttributes("boxBorderT", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBorderL", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBorderB", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBorderR", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBorderUnit", "string", {
          desktop: "px",
          tablet: "px",
          mobile: "px",
        }),
        ...zlgcbCreateAttributes("boxBorderColor", "string", "#df00ff"),
        ...zlgcbCreateResponsiveAttributes("boxTPadding", "number", {
          desktop: "35",
          tablet: "25",
          mobile: "40",
        }),
        ...zlgcbCreateResponsiveAttributes("boxLPadding", "number", {
          desktop: "45",
          tablet: "25",
          mobile: "30",
        }),
        ...zlgcbCreateResponsiveAttributes("boxBPadding", "number", {
          desktop: "35",
          tablet: "25",
          mobile: "40",
        }),
        ...zlgcbCreateResponsiveAttributes("boxRPadding", "number", {
          desktop: "45",
          tablet: "25",
          mobile: "30",
        }),
        ...zlgcbCreateResponsiveAttributes("boxPaddingUnit", "string", {
          desktop: "px",
          tablet: "px",
          mobile: "px",
        }),
        ...zlgcbCreateResponsiveAttributes("boxBoxshadowHoffset", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBoxshadowVoffset", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBoxshadowBlur", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBoxshadowSpread", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("boxBoxshadowUnit", "string", {
          desktop: "px",
          tablet: "px",
          mobile: "px",
        }),
        ...zlgcbCreateAttributes("boxBoxshadowColor", "string"),
        ...zlgcbCreateAttributes("boxBackgroundImage", "string", ""),
        ...zlgcbCreateResponsiveAttributes(
          "boxBackgroundImagePosition",
          "string",
          {
            desktop: "center center",
            tablet: "center center",
            mobile: "center center",
          }
        ),
        ...zlgcbCreateAttributes(
          "boxBackgroundImageAttachment",
          "string",
          "scroll"
        ),
        ...zlgcbCreateAttributes(
          "boxBackgroundImageRepeat",
          "string",
          "no-repeat"
        ),
        ...zlgcbCreateResponsiveAttributes(
          "boxBackgroundImageDisplaySize",
          "string",
          {
            desktop: "contain",
            tablet: "cover",
            mobile: "cover",
          }
        ),
        ...zlgcbCreateAttributes("boxAnimation", "string", ""),
        ...zlgcbCreateAttributes("imageUrl", "string", ""),
        ...zlgcbCreateResponsiveAttributes("imageWidth", "number", {
          desktop: 50,
          tablet: 40,
          mobile: 30,
        }),
        ...zlgcbCreateResponsiveAttributes("imageWidthUnit", "string", {
          desktop: "px",
          tablet: "px",
          mobile: "px",
        }),
        ...zlgcbCreateResponsiveAttributes("imageHeight", "number", {
          desktop: 50,
          tablet: 40,
          mobile: 30,
        }),
        ...zlgcbCreateResponsiveAttributes("imageHeightUnit", "string", {
          desktop: "px",
          tablet: "px",
          mobile: "px",
        }),
        ...zlgcbCreateResponsiveAttributes("imageDisplaySize", "string", {
          desktop: "contain",
          tablet: "contain",
          mobile: "contain",
        }),
        ...zlgcbCreateResponsiveAttributes("imageBorderTRadius", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("imageBorderLRadius", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("imageBorderBRadius", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("imageBorderRRadius", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("imageBorderRadiusUnit", "string", {
          desktop: "px",
          tablet: "px",
          mobile: "px",
        }),
        ...zlgcbCreateResponsiveAttributes("imageBorderT", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("imageBorderL", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("imageBorderB", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("imageBorderR", "number", {
          desktop: null,
          tablet: null,
          mobile: null,
        }),
        ...zlgcbCreateResponsiveAttributes("imageBorderUnit", "string", {
          desktop: "px",
          tablet: "px",
          mobile: "px",
        }),
        ...zlgcbCreateAttributes("imageBorderStyle", "string", "none"),
        ...zlgcbCreateAttributes("imageBorderColor", "string"),
        ...zlgcbCreateAttributes("clientId", "string", ""),

        /**
         * Font options configuration.
         * @property {string} type - Specifies the type of data, which is an array in this case.
         * @property {array} default - Default value set as an empty array.
         */
        fontOptions: {
          type: "array",
          default: [],
        },
      },

      edit: function (props) {
        // Destructure props to access specific values
        const { attributes, setAttributes, clientId } = props;
        // State to hold font options retrieved from Google Fonts API
        const [fontOptions, setFontOptions] = useState([]);
        // Generate a unique class name for the block using the client ID
        // This ensures that each block instance has a unique class for custom styling
        const uniqueClass = (attributes.clientId = `block-${clientId}`);

        // Fetch Google Fonts API data once on component mount
        useEffect(() => {
          zlgcbFetchGoogleFonts(setFontOptions);
        }, []);

        // Update dynamic styles whenever attributes or uniqueClass change
        useEffect(() => {
          zlgcbInjectDynamicStyles(attributes, uniqueClass); // Inject styles when attributes change
        }, [attributes, uniqueClass]);

        return [
          // Inspector Controls for the block settings
          el(
            InspectorControls,
            {},

            /**
             *
             * Counter Data Panel
             */
            el(
              PanelBody,
              {
                title: "Counter Data",
                initialOpen: false,
              },

              // Counter Title
              zlgcbCommonControl(
                TextControl,
                attributes,
                "Title",
                "string",
                "counterLabel",
                setAttributes
              ),

              // Starting numbers
              zlgcbCommonControl(
                TextControl,
                attributes,
                "Starting numbers",
                "number",
                "start",
                setAttributes,
                0,
                9999
              ),

              // Ending numbers
              zlgcbCommonControl(
                TextControl,
                attributes,
                "Ending numbers",
                "number",
                "end",
                setAttributes,
                0,
                9999
              ),

              // Counter Prefix Value
              zlgcbCommonControl(
                TextControl,
                attributes,
                "Prefix",
                "string",
                "counterNumberPrefix",
                setAttributes
              ),

              // Counter Suffix Value
              zlgcbCommonControl(
                TextControl,
                attributes,
                "Suffix",
                "string",
                "counterNumberSuffix",
                setAttributes
              ),

              // Counter Animation speed
              zlgcbCommonControl(
                RangeControl,
                attributes,
                "Duration (ms)",
                "number",
                "duration",
                setAttributes,
                100,
                5000
              ),

              /**
               *
               * Image Panel
               */
              el(
                PanelBody,
                {
                  title: "Icon",
                  initialOpen: false,
                },

                // Display the selected image
                attributes.imageUrl &&
                  el("img", {
                    src: attributes.imageUrl,
                    style: {
                      marginTop: "10px",
                      maxWidth: "100%",
                    },
                  }),

                el(
                  "div",
                  {
                    style: {
                      display: "flex",
                      "justify-content": "center",
                      gap: "15px",
                    },
                  },
                  // MediaUpload component for handling image uploads and removal
                  el(MediaUpload, {
                    // Triggered when an image is selected
                    onSelect: function (media) {
                      // Update attributes with the selected image URL
                      setAttributes({
                        imageUrl: media.url,
                      });
                    },
                    allowedTypes: "image",
                    value: attributes.imageUrl,
                    render: function (obj) {
                      return el(
                        Button,
                        {
                          className: "button button-large",
                          // Open media library dialog on button click
                          onClick: obj.open,
                        },
                        // Toggle button text based on whether imageUrl is set
                        !attributes.imageUrl ? "Upload Image" : "Replace"
                      );
                    },
                  }),

                  // Conditionally render a button to remove the image if imageUrl is set
                  attributes.imageUrl &&
                    el(
                      Button,
                      {
                        className: "button btn-danger zlgcb-mb-20",
                        onClick: function (e) {
                          e.stopPropagation(); // Prevent event propagation
                          // Clear imageUrl attribute on button click
                          setAttributes({
                            imageUrl: "",
                          });
                        },
                      },
                      "Remove"
                    )
                ),

                // Display style options for image
                zlgcbConditionalRender(
                  attributes.imageUrl !== "",
                  el(
                    "div",
                    {},

                    el(
                      "div",
                      { className: "zlgcb-flex" },

                      // Image Weight
                      zlgcbGroupedAttributeRow(
                        attributes,
                        "Width",
                        "number",
                        ["imageWidth", "imageWidthUnit"],
                        setAttributes
                      ),

                      // Responsive
                      zlgcbSelectControlWithIcons(
                        attributes,
                        "",
                        "counterNumberResponsive",
                        [
                          { label: "Desktop", value: "desktop" },
                          { label: "Tablet", value: "tablet" },
                          { label: "Mobile", value: "mobile" },
                        ],
                        setAttributes
                      )
                    ),

                    el(
                      "div",
                      { className: "zlgcb-flex" },

                      // Image Height
                      zlgcbGroupedAttributeRow(
                        attributes,
                        "Height",
                        "number",
                        ["imageHeight", "imageHeightUnit"],
                        setAttributes
                      ),

                      // Responsive
                      zlgcbSelectControlWithIcons(
                        attributes,
                        "",
                        "counterNumberResponsive",
                        [
                          { label: "Desktop", value: "desktop" },
                          { label: "Tablet", value: "tablet" },
                          { label: "Mobile", value: "mobile" },
                        ],
                        setAttributes
                      )
                    ),

                    el(
                      "div",
                      { className: "zlgcb-flex" },

                      // Image Display Size
                      zlgcbSelectControl(
                        attributes,
                        "Display Size",
                        zlgcbGetResponsiveAttribute(
                          attributes,
                          "imageDisplaySize"
                        ),
                        [
                          { label: "Cover", value: "cover" },
                          { label: "Contain", value: "contain" },
                          { label: "Fill", value: "fill" },
                        ],
                        "",
                        setAttributes
                      ),

                      // Responsive
                      zlgcbSelectControlWithIcons(
                        attributes,
                        "",
                        "counterNumberResponsive",
                        [
                          { label: "Desktop", value: "desktop" },
                          { label: "Tablet", value: "tablet" },
                          { label: "Mobile", value: "mobile" },
                        ],
                        setAttributes
                      )
                    ),

                    // Image Border Style
                    zlgcbSelectControl(
                      attributes,
                      "Border Style",
                      "imageBorderStyle",
                      [
                        { label: "None", value: "none" },
                        { label: "Solid", value: "solid" },
                        { label: "Dotted", value: "dotted" },
                        { label: "Dashed", value: "dashed" },
                        { label: "Inset", value: "inset" },
                        { label: "Outset", value: "outset" },
                        { label: "Ridge", value: "ridge" },
                        { label: "Groove", value: "groove" },
                        { label: "Double", value: "double" },
                      ],
                      "",
                      setAttributes
                    ),

                    zlgcbConditionalRender(
                      attributes.imageBorderStyle !== "none",

                      el(
                        "div",
                        { className: "zlgcb-flex zlgcb-res-button" },

                        // Image Border Width
                        zlgcbCreateMultipleAttributeControls(
                          attributes,
                          "Border",
                          "number",
                          [
                            "imageBorderT",
                            "imageBorderL",
                            "imageBorderB",
                            "imageBorderR",
                          ],
                          "imageBorderUnit",
                          setAttributes
                        ),

                        // Responsive
                        zlgcbSelectControlWithIcons(
                          attributes,
                          "",
                          "counterNumberResponsive",
                          [
                            { label: "Desktop", value: "desktop" },
                            { label: "Tablet", value: "tablet" },
                            { label: "Mobile", value: "mobile" },
                          ],
                          setAttributes
                        )
                      )
                    ),

                    // Image Border Color
                    zlgcbConditionalRender(
                      attributes.imageBorderStyle !== "none",

                      el(
                        "div",
                        {
                          className: "zlgcb-flex",
                        },
                        el(
                          "label",
                          {
                            className: "zlgcb-attribute-label zlgcb-mt-20",
                          },
                          "Border Color"
                        ),

                        el(
                          "div",
                          {
                            className: "zlgcb-color-palette zlgcb-mt-20",
                          },
                          zlgcbCommonControl(
                            ColorPalette,
                            attributes,
                            "Border Color",
                            "string",
                            "imageBorderColor",
                            setAttributes
                          )
                        )
                      )
                    ),

                    el(
                      "div",
                      { className: "zlgcb-flex zlgcb-res-button" },

                      // Image Border Radius
                      zlgcbCreateMultipleAttributeControls(
                        attributes,
                        "Border-Radius",
                        "number",
                        [
                          "imageBorderTRadius",
                          "imageBorderLRadius",
                          "imageBorderBRadius",
                          "imageBorderRRadius",
                        ],
                        "imageBorderRadiusUnit",
                        setAttributes
                      ),

                      // Responsive
                      zlgcbSelectControlWithIcons(
                        attributes,
                        "",
                        "counterNumberResponsive",
                        [
                          { label: "Desktop", value: "desktop" },
                          { label: "Tablet", value: "tablet" },
                          { label: "Mobile", value: "mobile" },
                        ],
                        setAttributes
                      )
                    )
                  )
                ),

                el(
                  "span",
                  {
                    className: "zlgcb-d-block zlgcb-mt-20",
                  },
                  "Icon will'be shown on the top of the Counter Number"
                )
              )
            ),

            /**
             *
             * Counter Style Panel
             */
            el(
              PanelBody,
              {
                title: "Counter Style",
                initialOpen: false,
              },
              el(
                PanelBody,
                {
                  title: "Select Your Layout",
                  initialOpen: false,
                },
                zlgcbSelectControl(
                  attributes,
                  "",
                  "counterLayout",
                  [
                    { label: "Layout 1", value: "layout1" },
                    { label: "Layout 2", value: "layout2" },
                    { label: "Layout 3", value: "layout3" },
                    { label: "Layout 4", value: "layout4" },
                  ],
                  "",
                  setAttributes
                )
              ),

              /**
               *
               * Font Typography Panel
               */
              el(
                PanelBody,
                {
                  title: "Typography",
                  initialOpen: false,
                },

                el(
                  "div",
                  {
                    className: "zlgcb-element-center",
                  },
                  el("label", {}, "Number Typography"),

                  el(
                    "div",
                    {},
                    // Counter Number Style Panel
                    zlgcbDropdownControl(
                      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/>
                      </svg>`,

                      el(
                        "div",
                        {},

                        el(
                          "div",
                          { className: "zlgcb-flex zlgcb-mb-20" },

                          // Counter Number Font Align
                          zlgcbSelectControl(
                            attributes,
                            "Text Align",
                            zlgcbGetResponsiveAttribute(
                              attributes,
                              "counterNumberFontAlign"
                            ),
                            [
                              { label: "Left", value: "left" },
                              { label: "Center", value: "center" },
                              { label: "Right", value: "right" },
                            ],
                            "",
                            setAttributes
                          ),

                          // Responsive
                          zlgcbSelectControlWithIcons(
                            attributes,
                            "",
                            "counterNumberResponsive",
                            [
                              { label: "Desktop", value: "desktop" },
                              { label: "Tablet", value: "tablet" },
                              { label: "Mobile", value: "mobile" },
                            ],
                            setAttributes
                          )
                        ),

                        // Counter Number Text Color
                        el(
                          "div",
                          {
                            className: "zlgcb-flex",
                          },
                          el(
                            "label",
                            {
                              className: "zlgcb-attribute-label",
                            },
                            "Text Color"
                          ),

                          el(
                            "div",
                            {
                              className: "zlgcb-color-palette",
                            },
                            zlgcbCommonControl(
                              ColorPalette,
                              attributes,
                              "Text Color",
                              "string",
                              "counterNumberColor",
                              setAttributes
                            )
                          )
                        ),

                        // Counter Number Loader Color
                        attributes.counterLayout === "layout1" &&
                          el(
                            "div",
                            {
                              className: "zlgcb-flex zlgcb-mt-20",
                            },
                            el(
                              "label",
                              {
                                className: "zlgcb-attribute-label",
                              },
                              "Loader Color"
                            ),

                            el(
                              "div",
                              {
                                className: "zlgcb-color-palette",
                              },
                              zlgcbCommonControl(
                                ColorPalette,
                                attributes,
                                "Loader Background color",
                                "string",
                                "counterNumberLoaderColor",
                                setAttributes
                              )
                            )
                          ),

                        // Counter Number Background Color
                        attributes.counterLayout === "layout1" &&
                          el(
                            "div",
                            {
                              className: "zlgcb-flex",
                            },
                            el(
                              "label",
                              {
                                className: "zlgcb-attribute-label",
                              },
                              "Background Color"
                            ),

                            el(
                              "div",
                              {
                                className: "zlgcb-color-palette",
                              },
                              zlgcbCommonControl(
                                ColorPalette,
                                attributes,
                                "Background Color",
                                "string",
                                "counterNumberBgColor",
                                setAttributes
                              )
                            )
                          ),

                        // Counter Number Font Family
                        zlgcbSelectControl(
                          attributes,
                          "Font Family",
                          "counterNumberFontFamily",
                          fontOptions,
                          "zlgcb-mt-20",
                          setAttributes
                        ),

                        el(
                          "div",
                          { className: "zlgcb-flex zlgcb-mt-20" },

                          // Counter Number Font Size
                          zlgcbGroupedAttributeRow(
                            attributes,
                            "Font Size",
                            "number",
                            [
                              "counterNumberFontSize",
                              "counterNumberFontSizeUnit",
                            ],
                            setAttributes
                          ),

                          // Responsive
                          zlgcbSelectControlWithIcons(
                            attributes,
                            "",
                            "counterNumberResponsive",
                            [
                              { label: "Desktop", value: "desktop" },
                              { label: "Tablet", value: "tablet" },
                              { label: "Mobile", value: "mobile" },
                            ],
                            setAttributes
                          )
                        ),

                        el(
                          "div",
                          { className: "zlgcb-flex zlgcb-mt-20" },

                          // Counter Number Line-height
                          zlgcbGroupedAttributeRow(
                            attributes,
                            "Line-height",
                            "number",
                            [
                              "counterNumberFontLineHeight",
                              "counterNumberFontLineHeightUnit",
                            ],
                            setAttributes
                          ),

                          // Responsive
                          zlgcbSelectControlWithIcons(
                            attributes,
                            "",
                            "counterNumberResponsive",
                            [
                              { label: "Desktop", value: "desktop" },
                              { label: "Tablet", value: "tablet" },
                              { label: "Mobile", value: "mobile" },
                            ],
                            setAttributes
                          )
                        ),

                        // Counter Number Font Weight
                        zlgcbSelectControl(
                          attributes,
                          "Font Weight",
                          "counterNumberFontWeight",
                          [
                            { label: "100", value: "100" },
                            { label: "200", value: "200" },
                            { label: "300", value: "300" },
                            { label: "400", value: "400" },
                            { label: "500", value: "500" },
                            { label: "600", value: "600" },
                            { label: "700", value: "700" },
                            { label: "800", value: "800" },
                            { label: "900", value: "900" },
                          ],
                          "zlgcb-mt-20",
                          setAttributes
                        ),

                        // Counter Number Font Style
                        zlgcbSelectControl(
                          attributes,
                          "Font Style",
                          "counterNumberFontStyle",
                          [
                            { label: "Normal", value: "normal" },
                            { label: "Italic", value: "italic" },
                          ],
                          "zlgcb-mt-20",
                          setAttributes
                        )
                      )
                    )
                  )
                ),

                el(
                  "div",
                  {
                    className: "zlgcb-element-center",
                  },
                  el("label", {}, "Label Typography"),

                  el(
                    "div",
                    {},
                    // Counter Number Style Panel
                    zlgcbDropdownControl(
                      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/>
                        </svg>`,

                      el(
                        "div",
                        {},

                        el(
                          "div",
                          { className: "zlgcb-flex zlgcb-mb-20" },

                          // Counter Label Font Align
                          zlgcbSelectControl(
                            attributes,
                            "Text Align",
                            zlgcbGetResponsiveAttribute(
                              attributes,
                              "counterLabelFontAlign"
                            ),
                            [
                              { label: "Left", value: "left" },
                              { label: "Center", value: "center" },
                              { label: "Right", value: "right" },
                            ],
                            "",
                            setAttributes
                          ),

                          // Responsive
                          zlgcbSelectControlWithIcons(
                            attributes,
                            "",
                            "counterNumberResponsive",
                            [
                              { label: "Desktop", value: "desktop" },
                              { label: "Tablet", value: "tablet" },
                              { label: "Mobile", value: "mobile" },
                            ],
                            setAttributes
                          )
                        ),

                        // Counter Label Text Color
                        el(
                          "div",
                          {
                            className: "zlgcb-flex zlgcb-mt-20",
                          },
                          el(
                            "label",
                            {
                              className: "zlgcb-attribute-label",
                            },
                            "Text Color"
                          ),

                          el(
                            "div",
                            {
                              className: "zlgcb-color-palette",
                            },
                            zlgcbCommonControl(
                              ColorPalette,
                              attributes,
                              "Text Color",
                              "string",
                              "counterLabelColor",
                              setAttributes
                            )
                          )
                        ),

                        // Counter Label Font Family
                        zlgcbSelectControl(
                          attributes,
                          "Font Family",
                          "counterLabelFontFamily",
                          fontOptions,
                          "zlgcb-mt-20",
                          setAttributes
                        ),

                        el(
                          "div",
                          { className: "zlgcb-flex zlgcb-mt-20" },
                          // Counter Label Font-Size
                          zlgcbGroupedAttributeRow(
                            attributes,
                            "Font Size",
                            "number",
                            [
                              "counterLabelFontSize",
                              "counterLabelFontSizeUnit",
                            ],
                            setAttributes
                          ),

                          // Responsive
                          zlgcbSelectControlWithIcons(
                            attributes,
                            "",
                            "counterNumberResponsive",
                            [
                              { label: "Desktop", value: "desktop" },
                              { label: "Tablet", value: "tablet" },
                              { label: "Mobile", value: "mobile" },
                            ],
                            setAttributes
                          )
                        ),

                        el(
                          "div",
                          { className: "zlgcb-flex zlgcb-mt-20" },

                          // Counter Label Line-height
                          zlgcbGroupedAttributeRow(
                            attributes,
                            "Line-height",
                            "number",
                            [
                              "counterLabelFontLineHeight",
                              "counterLabelFontLineHeightUnit",
                            ],
                            setAttributes
                          ),

                          // Responsive
                          zlgcbSelectControlWithIcons(
                            attributes,
                            "",
                            "counterNumberResponsive",
                            [
                              { label: "Desktop", value: "desktop" },
                              { label: "Tablet", value: "tablet" },
                              { label: "Mobile", value: "mobile" },
                            ],
                            setAttributes
                          )
                        ),

                        // Counter Label Font Weight
                        zlgcbSelectControl(
                          attributes,
                          "Font Weight",
                          "counterLabelFontWeight",
                          [
                            { label: "100", value: "100" },
                            { label: "200", value: "200" },
                            { label: "300", value: "300" },
                            { label: "400", value: "400" },
                            { label: "500", value: "500" },
                            { label: "600", value: "600" },
                            { label: "700", value: "700" },
                            { label: "800", value: "800" },
                            { label: "900", value: "900" },
                          ],
                          "zlgcb-mt-20",
                          setAttributes
                        ),

                        // Counter Label Font Style
                        zlgcbSelectControl(
                          attributes,
                          "Font Style",
                          "counterLabelFontStyle",
                          [
                            { label: "Normal", value: "normal" },
                            { label: "Italic", value: "italic" },
                          ],
                          "zlgcb-mt-20",
                          setAttributes
                        ),

                        // Counter Label Text transform
                        zlgcbSelectControl(
                          attributes,
                          "Text transform",
                          "counterLabelFontTextTransform",
                          [
                            { label: "None", value: "none" },
                            { label: "Uppercase", value: "uppercase" },
                            { label: "Capitalize", value: "capitalize" },
                            { label: "Lowercase", value: "lowercase" },
                          ],
                          "zlgcb-mt-20",
                          setAttributes
                        )
                      )
                    )
                  )
                )
              ),

              /**
               *
               * Box Style Panel
               */
              el(
                PanelBody,
                {
                  title: "Box Style",
                  initialOpen: false,
                },

                el(
                  "div",
                  { className: "zlgcb-flex zlgcb-mt-20 zlgcb-res-button " },

                  // Box Padding
                  zlgcbCreateMultipleAttributeControls(
                    attributes,
                    "Padding",
                    "number",
                    [
                      "boxTPadding",
                      "boxLPadding",
                      "boxBPadding",
                      "boxRPadding",
                    ],
                    "boxPaddingUnit",
                    setAttributes
                  ),

                  // Responsive
                  zlgcbSelectControlWithIcons(
                    attributes,
                    "",
                    "counterNumberResponsive",
                    [
                      { label: "Desktop", value: "desktop" },
                      { label: "Tablet", value: "tablet" },
                      { label: "Mobile", value: "mobile" },
                    ],
                    setAttributes
                  )
                ),

                // Box Background color
                el(
                  "div",
                  {
                    className: "zlgcb-flex zlgcb-mt-20",
                  },
                  el(
                    "label",
                    {
                      className: "zlgcb-attribute-label",
                    },
                    "Background Color"
                  ),

                  el(
                    "div",
                    {
                      className: "zlgcb-color-palette",
                    },
                    zlgcbCommonControl(
                      ColorPalette,
                      attributes,
                      "Background Color",
                      "string",
                      "backgroundColor",
                      setAttributes
                    )
                  )
                ),

                // Box Border Style
                zlgcbSelectControl(
                  attributes,
                  "Border Style",
                  "boxBorderStyle",
                  [
                    { label: "None", value: "none" },
                    { label: "Solid", value: "solid" },
                    { label: "Dotted", value: "dotted" },
                    { label: "Dashed", value: "dashed" },
                    { label: "Inset", value: "inset" },
                    { label: "Outset", value: "outset" },
                    { label: "Ridge", value: "ridge" },
                    { label: "Groove", value: "groove" },
                    { label: "Double", value: "double" },
                  ],
                  "zlgcb-mt-20",
                  setAttributes
                ),

                zlgcbConditionalRender(
                  attributes.boxBorderStyle !== "none",

                  el(
                    "div",
                    { className: "zlgcb-flex zlgcb-mt-20 zlgcb-res-button" },

                    // Box Border
                    zlgcbCreateMultipleAttributeControls(
                      attributes,
                      "Border",
                      "number",
                      ["boxBorderT", "boxBorderL", "boxBorderB", "boxBorderR"],
                      "boxBorderUnit",
                      setAttributes
                    ),

                    // Responsive
                    zlgcbSelectControlWithIcons(
                      attributes,
                      "",
                      "counterNumberResponsive",
                      [
                        { label: "Desktop", value: "desktop" },
                        { label: "Tablet", value: "tablet" },
                        { label: "Mobile", value: "mobile" },
                      ],
                      setAttributes
                    )
                  )
                ),

                // Box Border Color
                zlgcbConditionalRender(
                  attributes.boxBorderStyle !== "none",

                  el(
                    "div",
                    {
                      className: "zlgcb-flex zlgcb-mt-20",
                    },
                    el(
                      "label",
                      {
                        className: "zlgcb-attribute-label",
                      },
                      "Border Color"
                    ),

                    el(
                      "div",
                      {
                        className: "zlgcb-color-palette",
                      },
                      zlgcbCommonControl(
                        ColorPalette,
                        attributes,
                        "Border Color",
                        "string",
                        "boxBorderColor",
                        setAttributes
                      )
                    )
                  )
                ),

                el(
                  "div",
                  { className: "zlgcb-flex zlgcb-mt-20 zlgcb-res-button" },

                  // Box Border Radius
                  zlgcbCreateMultipleAttributeControls(
                    attributes,
                    "Border-Radius",
                    "number",
                    [
                      "boxBorderTRadius",
                      "boxBorderLRadius",
                      "boxBorderBRadius",
                      "boxBorderRRadius",
                    ],
                    "boxBorderRadiusUnit",
                    setAttributes
                  ),

                  // Responsive
                  zlgcbSelectControlWithIcons(
                    attributes,
                    "",
                    "counterNumberResponsive",
                    [
                      { label: "Desktop", value: "desktop" },
                      { label: "Tablet", value: "tablet" },
                      { label: "Mobile", value: "mobile" },
                    ],
                    setAttributes
                  )
                )
              ),

              /**
               *
               * Box Shadow Panel
               */
              el(
                PanelBody,
                {
                  title: "Box Shadow",
                  initialOpen: false,
                },

                // Box Shadow Color
                el(
                  "div",
                  {
                    className: "zlgcb-flex",
                  },
                  el(
                    "label",
                    {
                      className: "zlgcb-attribute-label",
                    },
                    "Box Shadow Color"
                  ),

                  el(
                    "div",
                    {
                      className: "zlgcb-color-palette",
                    },
                    zlgcbCommonControl(
                      ColorPalette,
                      attributes,
                      "Color",
                      "string",
                      "boxBoxshadowColor",
                      setAttributes
                    )
                  )
                ),

                el(
                  "div",
                  { className: "zlgcb-flex zlgcb-mt-20" },

                  // Box Shadow Horizontal Offset
                  zlgcbCommonControl(
                    TextControl,
                    attributes,
                    "H-Offset",
                    "number",
                    zlgcbGetResponsiveAttribute(
                      attributes,
                      "boxBoxshadowHoffset"
                    ),
                    setAttributes
                  ),

                  // Responsive
                  zlgcbSelectControlWithIcons(
                    attributes,
                    "",
                    "counterNumberResponsive",
                    [
                      { label: "Desktop", value: "desktop" },
                      { label: "Tablet", value: "tablet" },
                      { label: "Mobile", value: "mobile" },
                    ],
                    setAttributes
                  )
                ),

                el(
                  "div",
                  { className: "zlgcb-flex" },

                  // Box Shadow Vertical Offset
                  zlgcbCommonControl(
                    TextControl,
                    attributes,
                    "V-Offset",
                    "number",
                    zlgcbGetResponsiveAttribute(
                      attributes,
                      "boxBoxshadowVoffset"
                    ),
                    setAttributes
                  ),

                  // Responsive
                  zlgcbSelectControlWithIcons(
                    attributes,
                    "",
                    "counterNumberResponsive",
                    [
                      { label: "Desktop", value: "desktop" },
                      { label: "Tablet", value: "tablet" },
                      { label: "Mobile", value: "mobile" },
                    ],
                    setAttributes
                  )
                ),

                el(
                  "div",
                  { className: "zlgcb-flex" },

                  // Box Shadow Blur
                  zlgcbCommonControl(
                    TextControl,
                    attributes,
                    "Blur",
                    "number",
                    zlgcbGetResponsiveAttribute(attributes, "boxBoxshadowBlur"),
                    setAttributes
                  ),

                  // Responsive
                  zlgcbSelectControlWithIcons(
                    attributes,
                    "",
                    "counterNumberResponsive",
                    [
                      { label: "Desktop", value: "desktop" },
                      { label: "Tablet", value: "tablet" },
                      { label: "Mobile", value: "mobile" },
                    ],
                    setAttributes
                  )
                ),

                el(
                  "div",
                  { className: "zlgcb-flex" },

                  // Box Shadow Spread
                  zlgcbCommonControl(
                    TextControl,
                    attributes,
                    "Spread",
                    "number",
                    zlgcbGetResponsiveAttribute(
                      attributes,
                      "boxBoxshadowSpread"
                    ),
                    setAttributes
                  ),

                  // Responsive
                  zlgcbSelectControlWithIcons(
                    attributes,
                    "",
                    "counterNumberResponsive",
                    [
                      { label: "Desktop", value: "desktop" },
                      { label: "Tablet", value: "tablet" },
                      { label: "Mobile", value: "mobile" },
                    ],
                    setAttributes
                  )
                )
              ),

              /**
               *
               * Box Background Image Panel
               */
              el(
                PanelBody,
                {
                  title: "Box Background Image",
                  initialOpen: false,
                },

                // Preview of the of Image
                attributes.boxBackgroundImage &&
                  el("img", {
                    src: attributes.boxBackgroundImage,
                    style: {
                      marginTop: "10px",
                      maxWidth: "100%",
                    },
                  }),

                // Box Background Image
                el(
                  "div",
                  {
                    style: {
                      display: "flex",
                      "justify-content": "center",
                      gap: "15px",
                    },
                  },
                  el(MediaUpload, {
                    onSelect: function (media) {
                      setAttributes({
                        boxBackgroundImage: media.url,
                      });
                    },
                    allowedTypes: "image",
                    value: attributes.boxBackgroundImage,
                    render: function (obj) {
                      return el(
                        Button,
                        {
                          className: "button button-large zlgcb-mb-20",
                          onClick: obj.open,
                        },
                        !attributes.boxBackgroundImage
                          ? "Upload Image"
                          : "Replace"
                      );
                    },
                  }),
                  attributes.boxBackgroundImage &&
                    el(
                      Button,
                      {
                        className: "button btn-danger zlgcb-mb-20",
                        onClick: function (e) {
                          e.stopPropagation();
                          setAttributes({
                            boxBackgroundImage: "",
                          });
                          x;
                        },
                      },
                      "Remove"
                    )
                ),

                zlgcbConditionalRender(
                  attributes.boxBackgroundImage !== "",

                  el(
                    "div",
                    {},

                    el(
                      "div",
                      { className: "zlgcb-flex" },

                      // Box Background Image position
                      zlgcbSelectControl(
                        attributes,
                        "Position",
                        zlgcbGetResponsiveAttribute(
                          attributes,
                          "boxBackgroundImagePosition"
                        ),
                        [
                          { label: "Center Center", value: "center center" },
                          { label: "Center Left", value: "center left" },
                          { label: "Center Right", value: "center right" },
                          { label: "Top Center", value: "top center" },
                          { label: "Top Left", value: "top left" },
                          { label: "Top Right", value: "top right" },
                          { label: "Bottom Center", value: "bottom center" },
                          { label: "Bottom Left", value: "bottom left" },
                          { label: "Bottom Right", value: "bottom right" },
                        ],
                        "",
                        setAttributes
                      ),

                      // Responsive
                      zlgcbSelectControlWithIcons(
                        attributes,
                        "",
                        "counterNumberResponsive",
                        [
                          { label: "Desktop", value: "desktop" },
                          { label: "Tablet", value: "tablet" },
                          { label: "Mobile", value: "mobile" },
                        ],
                        setAttributes
                      )
                    ),

                    // Box Background Image Attachment
                    zlgcbSelectControl(
                      attributes,
                      "Attachment",
                      "boxBackgroundImageAttachment",
                      [
                        { label: "Scroll", value: "scroll" },
                        { label: "Fixed", value: "fixed" },
                      ],
                      "",
                      setAttributes
                    ),

                    // Box Background Image Repeat
                    zlgcbSelectControl(
                      attributes,
                      "Repeat",
                      "boxBackgroundImageRepeat",
                      [
                        { label: "No-repeat", value: "no-repeat" },
                        { label: "Repeat", value: "repeat" },
                        { label: "Repeat-x", value: "repeat-x" },
                        { label: "Repeat-y", value: "repeat-y" },
                      ],
                      "",
                      setAttributes
                    ),

                    el(
                      "div",
                      { className: "zlgcb-flex" },

                      // Box Background Image Display Size
                      zlgcbSelectControl(
                        attributes,
                        "Display Size",
                        zlgcbGetResponsiveAttribute(
                          attributes,
                          "boxBackgroundImageDisplaySize"
                        ),
                        [
                          { label: "Auto", value: "auto" },
                          { label: "Cover", value: "cover" },
                          { label: "Contain", value: "contain" },
                        ],
                        "",
                        setAttributes
                      ),

                      // Responsive
                      zlgcbSelectControlWithIcons(
                        attributes,
                        "",
                        "counterNumberResponsive",
                        [
                          { label: "Desktop", value: "desktop" },
                          { label: "Tablet", value: "tablet" },
                          { label: "Mobile", value: "mobile" },
                        ],
                        setAttributes
                      )
                    )
                  )
                ),
                el(
                  "span",
                  {
                    className: "zlgcb-d-block zlgcb-mt-20",
                  },
                  "Image for Box Background"
                )
              ),

              /**
               *
               * Box Animation Panel
               */
              el(
                PanelBody,
                {
                  title: "Box Animation",
                  initialOpen: false,
                },

                // Box Animation
                zlgcbSelectControl(
                  attributes,
                  "",
                  "boxAnimation",
                  [
                    { label: "None", value: "" },
                    { label: "Fade In", value: "zlgcb-fade-In" },
                    { label: "Fade In Up", value: "zlgcb-fade-In-Up" },
                    { label: "Fade In Down", value: "zlgcb-fade-In-Down" },
                    { label: "Fade In Left", value: "zlgcb-fade-In-Left" },
                    { label: "Fade In Right", value: "zlgcb-fade-In-Right" },
                  ],
                  "",
                  setAttributes
                )
              )
            )
          ),
          // The preview of the block in the editor
          zlgcbPreviewData(attributes, uniqueClass),
        ];
      },

      save: function (props) {
        // Destructure attributes and clientId from props
        const attributes = props.attributes;
        // Get the unique class ID from attributes
        const uniqueClass = attributes.clientId;

        // Check for End number not smaller then the Start number
        if (attributes.start >= attributes.end) {
          alert("End Number should be bigger then the Start number");
        }

        // Return the result of PreviewData directly
        return zlgcbPreviewData(attributes, uniqueClass);
      },
    });
  });
})(
  window.wp.blocks,
  window.wp.element,
  window.wp.editor,
  window.wp.components,
  window.wp.blockEditor
);