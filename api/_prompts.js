// Prompt construction lives server-side so /api/generate can only ever produce
// trip itineraries. If the client passed raw `messages[]`, the endpoint would be
// a free general-purpose LLM proxy for anyone who found it.
// Files prefixed with _ are not routable by Vercel.

export const MODEL = 'google/gemini-3.1-flash-lite-preview'
export const AICREDITS_BASE_URL = 'https://api.aicredits.in/v1'

const EXAMPLE_USER_PROMPT =
  'Generate Travel Plan for Location: Las Vegas, for 3 Days for Couple with a Cheap budget, Give me a Hotels options list with HotelName, Hotel address, Price, hotel image url, geo coordinates, rating, descriptions and suggest itinerary with placeName, Place Details, Place Image Url, Geo Coordinates, ticket Pricing, rating, Time travel each of the location for 3 days with each day plan with best time to visit in JSON format (only JSON in reply no extra non json required). '

const EXAMPLE_ASSISTANT_REPLY = `\`\`\`json
{
  "travelPlan": {
    "location": "Las Vegas",
    "duration": 3,
    "travelerType": "Couple",
    "budget": "Cheap",
    "hotelOptions": [
      {
        "hotelName": "Excalibur Hotel & Casino",
        "hotelAddress": "3850 S Las Vegas Blvd, Las Vegas, NV 89109, USA",
        "price": "Approximately $40 - $150 per night",
        "hotelImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Excalibur_Hotel_Casino_at_Night.jpg/1280px-Excalibur_Hotel_Casino_at_Night.jpg",
        "geoCoordinates": { "latitude": 36.0986, "longitude": -115.1758 },
        "rating": 3.5,
        "description": "A castle-themed hotel and casino located on the Las Vegas Strip, offering affordable rooms, a large casino, multiple dining options, and live entertainment."
      },
      {
        "hotelName": "The STRAT Hotel, Casino & SkyPod",
        "hotelAddress": "2000 S Las Vegas Blvd, Las Vegas, NV 89104, USA",
        "price": "Approximately $30 - $120 per night",
        "hotelImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Stratosphere_Tower_-_Las_Vegas.jpg/1280px-Stratosphere_Tower_-_Las_Vegas.jpg",
        "geoCoordinates": { "latitude": 36.1476, "longitude": -115.1568 },
        "rating": 3.5,
        "description": "Located at the north end of the Strip, this hotel is known for its iconic tower with thrill rides and observation decks, offering budget-friendly rooms and various dining choices."
      },
      {
        "hotelName": "Circus Circus Hotel & Casino",
        "hotelAddress": "2880 S Las Vegas Blvd, Las Vegas, NV 89109, USA",
        "price": "Approximately $25 - $100 per night",
        "hotelImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Circus_Circus_clown_marquee.jpg/1280px-Circus_Circus_clown_marquee.jpg",
        "geoCoordinates": { "latitude": 36.1379, "longitude": -115.1646 },
        "rating": 3,
        "description": "A family-friendly hotel with a circus theme, offering very affordable rates, a casino, and the Adventuredome indoor amusement park."
      }
    ],
    "itinerary": [
      {
        "day": 1,
        "theme": "South Strip Exploration",
        "bestTimeToVisit": "Late Afternoon to Evening",
        "plan": [
          {
            "placeName": "Welcome to Fabulous Las Vegas Sign",
            "placeDetails": "The iconic neon sign that has welcomed visitors to Las Vegas since 1959. A must-do photo opportunity.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Welcome_to_Fabulous_Las_Vegas_sign.jpg/1280px-Welcome_to_Fabulous_Las_Vegas_sign.jpg",
            "geoCoordinates": { "latitude": 36.0821, "longitude": -115.1728 },
            "ticketPricing": "Free",
            "rating": 4.5,
            "timeToTravel": "From the south end of the Strip, a short walk or a quick bus ride."
          },
          {
            "placeName": "Bellagio Conservatory & Botanical Gardens",
            "placeDetails": "A stunning 14,000-square-foot floral paradise inside the Bellagio Hotel. The displays change seasonally.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Bellagio_Conservatory_Chihuly.jpg/1280px-Bellagio_Conservatory_Chihuly.jpg",
            "geoCoordinates": { "latitude": 36.1126, "longitude": -115.1767 },
            "ticketPricing": "Free",
            "rating": 4.8,
            "timeToTravel": "A short walk from the Flamingo Wildlife Habitat, across the street."
          }
        ]
      },
      {
        "day": 2,
        "theme": "Mid-Strip and Entertainment",
        "bestTimeToVisit": "Afternoon and Evening",
        "plan": [
          {
            "placeName": "Grand Canal Shoppes at The Venetian Resort",
            "placeDetails": "A shopping mall with cobblestone walkways, a painted sky ceiling, and a quarter-mile Grand Canal with gondolas.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Grand_Canal_Shoppes_-_St._Mark%27s_Square.jpg/1280px-Grand_Canal_Shoppes_-_St._Mark%27s_Square.jpg",
            "geoCoordinates": { "latitude": 36.1214, "longitude": -115.1695 },
            "ticketPricing": "Free to enter",
            "rating": 4.6,
            "timeToTravel": "From the Bellagio area, a 15-20 minute walk or a short bus ride north."
          }
        ]
      },
      {
        "day": 3,
        "theme": "Downtown and Fremont Street",
        "bestTimeToVisit": "Evening",
        "plan": [
          {
            "placeName": "Fremont Street Experience",
            "placeDetails": "A pedestrian mall in Downtown Las Vegas, famous for its Viva Vision light shows and free live music.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Fremont_Street_Experience%2C_Las_Vegas%2C_2016.jpg/1920px-Fremont_Street_Experience%2C_Las_Vegas%2C_2016.jpg",
            "geoCoordinates": { "latitude": 36.1707, "longitude": -115.1439 },
            "ticketPricing": "Free",
            "rating": 4.6,
            "timeToTravel": "From the Strip, take the Deuce bus northbound, 20-40 minutes depending on traffic."
          }
        ]
      }
    ]
  }
}
\`\`\``

/** Builds the chat messages for a full trip generation from validated params. */
export function buildTripMessages({ location, noOfDays, budget, people }) {
  const userPrompt =
    `Generate Travel Plan for Location: ${location}, for ${noOfDays} Days for ${people} with a ${budget} budget, ` +
    'Give me a Hotels options list with HotelName, Hotel address, Price, hotel image url, geo coordinates, rating, descriptions ' +
    'and suggest itinerary with placeName, Place Details, Place Image Url, Geo Coordinates, ticket Pricing, rating, ' +
    `Time travel each of the location for ${noOfDays} days with each day plan with best time to visit in JSON format ` +
    '(only JSON in reply no extra non json required).'

  return [
    { role: 'user', content: EXAMPLE_USER_PROMPT },
    { role: 'assistant', content: EXAMPLE_ASSISTANT_REPLY },
    { role: 'user', content: userPrompt },
  ]
}
