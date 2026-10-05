/**
 * Auto-synced from backend/events/weddings/templates/template-1/manifest.json
 */

export const WEDDING_TEMPLATE_1_MANIFEST = {
  "id": "template-1",
  "type": "wedding",
  "label": "Wedding Template 1",
  "pages": [
    {
      "id": "openingVideo",
      "label": "Opening video",
      "defaultEnabled": true
    },
    {
      "id": "starting",
      "label": "Landing page",
      "defaultEnabled": true
    },
    {
      "id": "opening",
      "label": "Opening page",
      "defaultEnabled": true
    },
    {
      "id": "rsvp",
      "label": "RSVP",
      "defaultEnabled": true
    },
    {
      "id": "allDetails",
      "label": "All the details",
      "defaultEnabled": true
    },
    {
      "id": "ourStory",
      "label": "Our Story",
      "defaultEnabled": true
    },
    {
      "id": "bigDay",
      "label": "The Big Day",
      "defaultEnabled": true
    },
    {
      "id": "journey",
      "label": "Our Journey",
      "defaultEnabled": true
    },
    {
      "id": "closing",
      "label": "Closing",
      "defaultEnabled": true
    }
  ],
  "dynamicFields": [
    {
      "id": "openingVideo",
      "pageId": "openingVideo",
      "type": "media",
      "mediaKind": "video",
      "label": "Opening video"
    },
    {
      "id": "backgroundMusic",
      "pageId": "openingVideo",
      "type": "media",
      "mediaKind": "music",
      "label": "Background music"
    },
    {
      "id": "landingBackground",
      "pageId": "starting",
      "type": "media",
      "mediaKind": "background",
      "label": "Landing background image"
    },
    {
      "id": "landingBrideName",
      "pageId": "starting",
      "type": "text",
      "label": "Bride name",
      "defaultValue": ""
    },
    {
      "id": "landingGroomName",
      "pageId": "starting",
      "type": "text",
      "label": "Groom name",
      "defaultValue": ""
    },
    {
      "id": "colorLandingNames",
      "pageId": "starting",
      "type": "color",
      "label": "Landing — couple names & date",
      "defaultValue": "#7732A4"
    },
    {
      "id": "colorPageTitle",
      "pageId": "starting",
      "type": "color",
      "label": "Section titles (ALL THE DETAILS, RSVP, etc.)",
      "defaultValue": "#7732A4"
    },
    {
      "id": "colorSubtitle",
      "pageId": "starting",
      "type": "color",
      "label": "Subtitles & labels (uppercase headings, RSVP script)",
      "defaultValue": "#B54AB6"
    },
    {
      "id": "colorBodyText",
      "pageId": "starting",
      "type": "color",
      "label": "Body & detail text",
      "defaultValue": "#1B3601"
    },
    {
      "id": "colorIconFill",
      "pageId": "starting",
      "type": "color",
      "label": "Icon circles & map button",
      "defaultValue": "#473284"
    },
    {
      "id": "colorAccent",
      "pageId": "starting",
      "type": "color",
      "label": "Page background wash",
      "defaultValue": "#FAF6F0"
    },
    {
      "id": "colorSurface",
      "pageId": "starting",
      "type": "color",
      "label": "Gradient middle stop",
      "defaultValue": "#FFFFFF"
    },
    {
      "id": "gradientTop",
      "pageId": "starting",
      "type": "color",
      "label": "Page gradient — top",
      "defaultValue": "#FAF6F0"
    },
    {
      "id": "gradientMid",
      "pageId": "starting",
      "type": "color",
      "label": "Page gradient — middle",
      "defaultValue": "#FFFFFF"
    },
    {
      "id": "gradientBottom",
      "pageId": "starting",
      "type": "color",
      "label": "Page gradient — bottom",
      "defaultValue": "#FAF6F0"
    },
    {
      "id": "rsvpQuestions",
      "pageId": "rsvp",
      "type": "list",
      "label": "RSVP questions",
      "itemSchema": {
        "label": {
          "type": "text",
          "label": "Question label"
        },
        "inputType": {
          "type": "select",
          "label": "Field type",
          "options": [
            {
              "value": "text",
              "label": "Text"
            },
            {
              "value": "textarea",
              "label": "Text field"
            },
            {
              "value": "dropdown",
              "label": "Dropdown menu"
            }
          ]
        },
        "options": {
          "type": "dropdownItems",
          "label": "Dropdown menu items",
          "showWhen": {
            "field": "inputType",
            "equals": "dropdown"
          }
        }
      },
      "defaultValue": [
        {
          "label": "Will you be attending?",
          "inputType": "dropdown",
          "options": "Yes, No"
        },
        {
          "label": "Number of guests",
          "inputType": "text",
          "options": ""
        },
        {
          "label": "Wishes for the couple",
          "inputType": "textarea",
          "options": ""
        }
      ]
    },
    {
      "id": "detailNodes",
      "pageId": "allDetails",
      "type": "list",
      "label": "Information nodes",
      "itemSchema": {
        "label": {
          "type": "text",
          "label": "Title"
        },
        "value": {
          "type": "textarea",
          "label": "Content"
        },
        "phones": {
          "type": "contactPhones",
          "label": "Phone numbers",
          "max": 2
        }
      },
      "defaultValue": [
        {
          "label": "Ceremony setting",
          "value": "Outdoor ceremony",
          "iconKey": "ceremony"
        },
        {
          "label": "Weather note",
          "value": "",
          "iconKey": "weather"
        },
        {
          "label": "Parking note",
          "value": "",
          "iconKey": "parking"
        },
        {
          "label": "Contact",
          "kind": "contact",
          "iconKey": "contact",
          "phones": [
            {
              "name": "",
              "phone": ""
            },
            {
              "name": "",
              "phone": ""
            }
          ]
        }
      ],
      "addedItemIcon": "info"
    },
    {
      "id": "storyMilestones",
      "pageId": "ourStory",
      "type": "list",
      "label": "Our Story dates",
      "itemSchema": {
        "year": {
          "type": "text",
          "label": "Year"
        },
        "title": {
          "type": "text",
          "label": "Title"
        }
      },
      "defaultValue": [
        {
          "year": "2019",
          "title": "The day we met"
        },
        {
          "year": "2021",
          "title": "We fell in love"
        },
        {
          "year": "2023",
          "title": "The proposal"
        },
        {
          "year": "2026",
          "title": "Forever starts here"
        }
      ]
    },
    {
      "id": "journeyImages",
      "pageId": "journey",
      "type": "list",
      "label": "Journey images",
      "maxItems": 12,
      "itemSchema": {
        "orientation": {
          "type": "select",
          "label": "Orientation",
          "options": [
            {
              "value": "portrait",
              "label": "Portrait"
            },
            {
              "value": "landscape",
              "label": "Landscape"
            }
          ]
        },
        "caption": {
          "type": "textarea",
          "label": "Caption"
        },
        "filename": {
          "type": "imageRef",
          "label": "Image",
          "mediaKind": "images"
        }
      },
      "defaultValue": [
        {
          "orientation": "portrait",
          "caption": "Two souls\nOne promise.",
          "filename": ""
        },
        {
          "orientation": "portrait",
          "caption": "Little moments\nbig memories.",
          "filename": ""
        },
        {
          "orientation": "landscape",
          "caption": "Different\nchapters,\none love story.",
          "filename": ""
        },
        {
          "orientation": "portrait",
          "caption": "And the best\nis yet to come...",
          "filename": ""
        }
      ]
    }
  ]
};

export function invitePage(pageId) {
  return { "data-invite-page": pageId };
}

export function dynamicField(id) {
  return { "data-dynamic-field": id };
}

export default WEDDING_TEMPLATE_1_MANIFEST;
