/**
 * Auto-synced from backend/events/corporate-events/templates/template-1/manifest.json
 */

export const CORPORATE_TEMPLATE_1_MANIFEST = {
  "id": "template-1",
  "type": "corporate",
  "label": "Corporate Template 1",
  "pages": [
    {
      "id": "rsvp",
      "label": "RSVP",
      "defaultEnabled": true
    },
    {
      "id": "landing",
      "label": "Landing",
      "defaultEnabled": true
    },
    {
      "id": "eventDetails",
      "label": "Event details",
      "defaultEnabled": true
    },
    {
      "id": "agenda",
      "label": "Event agenda",
      "defaultEnabled": true
    },
    {
      "id": "location",
      "label": "Location",
      "defaultEnabled": true
    },
    {
      "id": "resources",
      "label": "Resources",
      "defaultEnabled": true
    },
    {
      "id": "addToCalendar",
      "label": "Add to calendar",
      "defaultEnabled": true
    },
    {
      "id": "ticketing",
      "label": "Ticketing",
      "defaultEnabled": true
    }
  ],
  "dynamicFields": [
    {
      "id": "openingVideo",
      "pageId": "landing",
      "type": "media",
      "mediaKind": "video",
      "label": "Landing / opening video"
    },
    {
      "id": "backgroundMusic",
      "pageId": "landing",
      "type": "media",
      "mediaKind": "music",
      "label": "Background music"
    },
    {
      "id": "landingBackground",
      "pageId": "landing",
      "type": "media",
      "mediaKind": "background",
      "label": "Landing background image"
    },
    {
      "id": "orgName",
      "pageId": "landing",
      "type": "text",
      "label": "Organization name",
      "defaultValue": "NEXORA"
    },
    {
      "id": "orgTagline",
      "pageId": "landing",
      "type": "text",
      "label": "Organization tagline",
      "defaultValue": "BUSINESS BEYOND BORDERS"
    },
    {
      "id": "eventTitle",
      "pageId": "landing",
      "type": "textarea",
      "label": "Event title",
      "defaultValue": "Annual Business\nSummit 2026"
    },
    {
      "id": "eventSubtitle",
      "pageId": "landing",
      "type": "text",
      "label": "Event subtitle",
      "defaultValue": "Ideas Today, A Smart Tomorrow."
    },
    {
      "id": "eventDateLabel",
      "pageId": "landing",
      "type": "text",
      "label": "Date label",
      "defaultValue": "Thursday, 12 November 2026"
    },
    {
      "id": "eventTimeLabel",
      "pageId": "landing",
      "type": "text",
      "label": "Time label",
      "defaultValue": "9.00 AM - 5.00PM"
    },
    {
      "id": "eventVenueLabel",
      "pageId": "landing",
      "type": "text",
      "label": "Venue label",
      "defaultValue": "Shangri-La, Colombo"
    },
    {
      "id": "colorTextPrimary",
      "pageId": "landing",
      "type": "color",
      "label": "Headings & primary text",
      "defaultValue": "#080480"
    },
    {
      "id": "colorTextHighlight",
      "pageId": "landing",
      "type": "color",
      "label": "Highlight text (agenda quotes)",
      "defaultValue": "#0084FF"
    },
    {
      "id": "gradientTop",
      "pageId": "landing",
      "type": "color",
      "label": "Page gradient — top",
      "defaultValue": "#D4E0F7"
    },
    {
      "id": "gradientMid",
      "pageId": "landing",
      "type": "color",
      "label": "Page gradient — middle",
      "defaultValue": "#FFFFFF"
    },
    {
      "id": "gradientBottom",
      "pageId": "landing",
      "type": "color",
      "label": "Page gradient — bottom",
      "defaultValue": "#A5DBFD"
    },
    {
      "id": "dressCode",
      "pageId": "eventDetails",
      "type": "text",
      "label": "Dress code",
      "defaultValue": "Smart Casual /professional Attire"
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
            },
            {
              "value": "radio",
              "label": "Radio buttons"
            }
          ]
        },
        "options": {
          "type": "dropdownItems",
          "label": "Choices",
          "showWhen": {
            "field": "inputType",
            "in": [
              "dropdown",
              "radio"
            ]
          }
        }
      },
      "defaultValue": [
        {
          "label": "First Name",
          "inputType": "text",
          "options": "",
          "placeholder": "Kavindu"
        },
        {
          "label": "Last Name",
          "inputType": "text",
          "options": "",
          "placeholder": "Perera"
        },
        {
          "label": "Email Address",
          "inputType": "text",
          "options": "",
          "placeholder": "kavindu@gmail.com"
        },
        {
          "label": "Mobile Number",
          "inputType": "text",
          "options": "",
          "placeholder": "+94  77  123  4567"
        },
        {
          "label": "NIC (National Identity Card)",
          "inputType": "text",
          "options": "",
          "placeholder": "199012345678",
          "helperText": "You can update your NIC later when purchasing tickets if you need."
        },
        {
          "label": "Will you attend?",
          "inputType": "radio",
          "options": "Yes, I'll attend | Sorry, I can't attend"
        },
        {
          "label": "Number of Guests",
          "inputType": "text",
          "options": "",
          "placeholder": "1"
        },
        {
          "label": "Meal Preference",
          "inputType": "dropdown",
          "options": "Veg or Non-Veg | Vegetarian | Non-Vegetarian"
        },
        {
          "label": "Any Special Requirements (Optional)",
          "inputType": "textarea",
          "options": "",
          "placeholder": "e.g. Food preference"
        }
      ]
    },
    {
      "id": "agendaItems",
      "pageId": "agenda",
      "type": "list",
      "label": "Agenda items",
      "itemSchema": {
        "time": {
          "type": "text",
          "label": "Time"
        },
        "title": {
          "type": "text",
          "label": "Title"
        },
        "location": {
          "type": "text",
          "label": "Location / note"
        }
      },
      "defaultValue": [
        {
          "time": "09:00 AM",
          "title": "Registration & Welcome Tea",
          "location": "Ocean View Lobby"
        },
        {
          "time": "09:30 AM",
          "title": "Opening Remarks",
          "location": "Grand Ballroom"
        },
        {
          "time": "10:00 AM",
          "title": "Keynote Session",
          "location": "The Future of Business"
        },
        {
          "time": "11:30 AM",
          "title": "Panel Discussion",
          "location": "Industry Trends"
        },
        {
          "time": "01:00 PM",
          "title": "Networking Lunch",
          "location": "Sapphire Lawn"
        },
        {
          "time": "02:30 PM",
          "title": "Breakout Sessions",
          "location": "Multiple Rooms"
        },
        {
          "time": "04:00 PM",
          "title": "Closing Ceremony",
          "location": "Main Ballroom"
        },
        {
          "time": "05:00 PM",
          "title": "Cocktail & Networking",
          "location": "Garden View"
        }
      ]
    },
    {
      "id": "resourcesList",
      "pageId": "resources",
      "type": "list",
      "label": "Resources",
      "itemSchema": {
        "name": {
          "type": "text",
          "label": "Display name"
        },
        "desc": {
          "type": "textarea",
          "label": "Description"
        },
        "filename": {
          "type": "fileRef",
          "label": "Document",
          "mediaKind": "documents"
        },
        "size": {
          "type": "readonly",
          "label": "Size"
        }
      },
      "defaultValue": [
        {
          "name": "Event Agenda.pdf",
          "desc": "Detailed schedule of the event sessions, timings and activities",
          "filename": "",
          "size": ""
        },
        {
          "name": "Venue & Directions.pdf",
          "desc": "Venue details, map, parking informations.",
          "filename": "",
          "size": ""
        },
        {
          "name": "Speaker Profiles.pdf",
          "desc": "Learn more about our keynote speakers and panelists.",
          "filename": "",
          "size": ""
        },
        {
          "name": "Event Information.pdf",
          "desc": "Important guidelines, venue policies & useful informations.",
          "filename": "",
          "size": ""
        }
      ]
    },
    {
      "id": "ticketEventTitle",
      "pageId": "ticketing",
      "type": "text",
      "label": "Event title on ticket",
      "defaultValue": "Auto Test Event 06"
    },
    {
      "id": "ticketSubtitle",
      "pageId": "ticketing",
      "type": "text",
      "label": "Event tagline / subtitle",
      "defaultValue": "AN EVENING CELEBRATION, NETWORKING, & ENTERTAINMENT."
    },
    {
      "id": "ticketHeroImage",
      "pageId": "ticketing",
      "type": "media",
      "mediaKind": "images",
      "label": "Ticket hero / venue image"
    },
    {
      "id": "ticketOrgName",
      "pageId": "ticketing",
      "type": "text",
      "label": "Organization badge text (over hero)",
      "defaultValue": "NEXORA"
    },
    {
      "id": "ticketQrLabel",
      "pageId": "ticketing",
      "type": "text",
      "label": "QR code caption",
      "defaultValue": "Scan at Check-In"
    },
    {
      "id": "ticketDateLabel",
      "pageId": "ticketing",
      "type": "text",
      "label": "Event date on ticket",
      "defaultValue": "12 November 2026"
    },
    {
      "id": "ticketTimeLabel",
      "pageId": "ticketing",
      "type": "text",
      "label": "Event time on ticket",
      "defaultValue": "6:00 PM Onwards"
    },
    {
      "id": "ticketVenueName",
      "pageId": "ticketing",
      "type": "text",
      "label": "Venue name",
      "defaultValue": "Colombo Grand Ballroom"
    },
    {
      "id": "ticketVenueCity",
      "pageId": "ticketing",
      "type": "text",
      "label": "Venue city / location",
      "defaultValue": "Colombo"
    },
    {
      "id": "ticketCategory",
      "pageId": "ticketing",
      "type": "text",
      "label": "Ticket category / tier",
      "defaultValue": "VIP"
    },
    {
      "id": "ticketPrice",
      "pageId": "ticketing",
      "type": "text",
      "label": "Ticket price (LKR)",
      "defaultValue": "2,000"
    },
    {
      "id": "ticketSeatLabel",
      "pageId": "ticketing",
      "type": "text",
      "label": "Seat no. / Admission note",
      "defaultValue": "GENERAL ADMISSION"
    },
    {
      "id": "ticketDownloadButtonText",
      "pageId": "ticketing",
      "type": "text",
      "label": "Download button label",
      "defaultValue": "Download Ticket"
    },
    {
      "id": "ticketBannerNotice",
      "pageId": "ticketing",
      "type": "text",
      "label": "Red footer banner notice",
      "defaultValue": "THIS IS AN E-TICKET – Present this ticket at event check-in."
    },
    {
      "id": "ticketTermsTitle",
      "pageId": "ticketing",
      "type": "text",
      "label": "Terms & conditions title",
      "defaultValue": "EVENT TERMS & CONDITIONS"
    },
    {
      "id": "ticketTermsText",
      "pageId": "ticketing",
      "type": "textarea",
      "label": "Terms & conditions points (one per line)",
      "defaultValue": "This ticket is valid only for the event.\nPlease present this e-ticket (digital or printed) at the event check-in counter.\nEach ticket admits one person as per the quantity purchased.\nTickets are non-transferable and non-refundable, except in case of event cancellation.\nThe organizer reserves the right to refuse entry for invalid or duplicated tickets.\nPlease follow the event guidelines and instructions from the event staff."
    }
  ]
};

export function invitePage(pageId) {
  return { "data-invite-page": pageId };
}

export function dynamicField(id) {
  return { "data-dynamic-field": id };
}

export default CORPORATE_TEMPLATE_1_MANIFEST;
