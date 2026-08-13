// Uses AICredits (https://aicredits.in) — an OpenAI-compatible gateway to Gemini and other models.

import axios from 'axios';

const AICREDITS_BASE_URL = 'https://api.aicredits.in/v1';
const MODEL = 'google/gemini-3.1-flash-lite-preview';

const exampleUserPrompt = `Generate Travel Plan for Location: Las Vegas, for 3 Days for Couple with a Cheap budget, Give me a Hotels options list with HotelName, Hotel address, Price, hotel image url, geo coordinates, rating, descriptions and suggest itinerary with placeName, Place Details, Place Image Url, Geo Coordinates, ticket Pricing, rating, Time travel each of the location for 3 days with each day plan with best time to visit in JSON format (only JSON in reply no extra non json required). `;

const exampleAssistantReply = `\`\`\`json
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
        "geoCoordinates": {
          "latitude": 36.0986,
          "longitude": -115.1758
        },
        "rating": 3.5,
        "description": "A castle-themed hotel and casino located on the Las Vegas Strip, offering affordable rooms, a large casino, multiple dining options, and live entertainment."
      },
      {
        "hotelName": "The STRAT Hotel, Casino & SkyPod",
        "hotelAddress": "2000 S Las Vegas Blvd, Las Vegas, NV 89104, USA",
        "price": "Approximately $30 - $120 per night",
        "hotelImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Stratosphere_Tower_-_Las_Vegas.jpg/1280px-Stratosphere_Tower_-_Las_Vegas.jpg",
        "geoCoordinates": {
          "latitude": 36.1476,
          "longitude": -115.1568
        },
        "rating": 3.5,
        "description": "Located at the north end of the Strip, this hotel is known for its iconic tower with thrill rides and observation decks, offering budget-friendly rooms and various dining choices."
      },
      {
        "hotelName": "Luxor Hotel & Casino",
        "hotelAddress": "3900 S Las Vegas Blvd, Las Vegas, NV 89119, USA",
        "price": "Approximately $50 - $180 per night",
        "hotelImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Luxor_Hotel.jpg/1280px-Luxor_Hotel.jpg",
        "geoCoordinates": {
          "latitude": 36.0955,
          "longitude": -115.1761
        },
        "rating": 3.5,
        "description": "A distinctive pyramid-shaped hotel and casino on the Strip, featuring a large atrium, a variety of entertainment options, and comfortable, affordable rooms."
      },
      {
        "hotelName": "Circus Circus Hotel & Casino",
        "hotelAddress": "2880 S Las Vegas Blvd, Las Vegas, NV 89109, USA",
        "price": "Approximately $25 - $100 per night",
        "hotelImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Circus_Circus_clown_marquee.jpg/1280px-Circus_Circus_clown_marquee.jpg",
        "geoCoordinates": {
          "latitude": 36.1379,
          "longitude": -115.1646
        },
        "rating": 3,
        "description": "A family-friendly hotel with a circus theme, offering very affordable rates, a casino, and the Adventuredome indoor amusement park."
      },
      {
        "hotelName": "Flamingo Las Vegas Hotel & Casino",
        "hotelAddress": "3555 S Las Vegas Blvd, Las Vegas, NV 89109, USA",
        "price": "Approximately $40 - $170 per night",
        "hotelImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flamingo_Las_Vegas_Hotel_and_Casino_-_Front.jpg/1280px-Flamingo_Las_Vegas_Hotel_and_Casino_-_Front.jpg",
        "geoCoordinates": {
          "latitude": 36.1164,
          "longitude": -115.1708
        },
        "rating": 3.5,
        "description": "A classic Las Vegas hotel with a vibrant, tropical theme, a central Strip location, and the popular Flamingo Wildlife Habitat."
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
            "placeDetails": "The iconic neon sign that has welcomed visitors to Las Vegas since 1959. A must-do photo opportunity. It is located in the median at 5100 Las Vegas Boulevard South.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Welcome_to_Fabulous_Las_Vegas_sign.jpg/1280px-Welcome_to_Fabulous_Las_Vegas_sign.jpg",
            "geoCoordinates": {
              "latitude": 36.0821,
              "longitude": -115.1728
            },
            "ticketPricing": "Free",
            "rating": 4.5,
            "timeToTravel": "Varies based on starting location. From the south end of the Strip, it's a short walk or a quick bus ride."
          },
          {
            "placeName": "Flamingo Wildlife Habitat",
            "placeDetails": "A serene and beautiful four-acre garden inside the Flamingo Hotel, home to Chilean flamingos, other exotic birds, turtles, and fish. A great free attraction to escape the hustle of the Strip.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/9/98/The_Wildlife_Habitat_-_Flamingo_Hotel_%26_Casino_Las_Vegas.jpg",
            "geoCoordinates": {
              "latitude": 36.1164,
              "longitude": -115.1708
            },
            "ticketPricing": "Free",
            "rating": 4.5,
            "timeToTravel": "From the 'Welcome' sign, it's about a 10-15 minute bus ride on 'The Deuce'."
          },
          {
            "placeName": "Bellagio Conservatory & Botanical Gardens",
            "placeDetails": "A stunning 14,000-square-foot floral paradise inside the Bellagio Hotel. The displays change seasonally and are always breathtaking. It's a free and highly-rated attraction.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Bellagio_Conservatory_Chihuly.jpg/1280px-Bellagio_Conservatory_Chihuly.jpg",
            "geoCoordinates": {
              "latitude": 36.1126,
              "longitude": -115.1767
            },
            "ticketPricing": "Free",
            "rating": 4.8,
            "timeToTravel": "A short walk from the Flamingo Wildlife Habitat, across the street."
          },
          {
            "placeName": "Fountains of Bellagio",
            "placeDetails": "An iconic free show of water, music, and light, the Fountains of Bellagio are a must-see. The show runs every 30 minutes in the afternoons and every 15 minutes in the evenings.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Bellagio_Fountains.jpg/1280px-Bellagio_Fountains.jpg",
            "geoCoordinates": {
              "latitude": 36.1126,
              "longitude": -115.1767
            },
            "ticketPricing": "Free",
            "rating": 4.8,
            "timeToTravel": "Located right in front of the Bellagio, next to the Conservatory."
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
            "placeDetails": "A unique shopping mall with cobblestone walkways, a painted sky ceiling, and a quarter-mile-long Grand Canal where you can watch the gondolas. It's free to walk around and window shop.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Grand_Canal_Shoppes_-_St._Mark%27s_Square.jpg/1280px-Grand_Canal_Shoppes_-_St._Mark%27s_Square.jpg",
            "geoCoordinates": {
              "latitude": 36.1214,
              "longitude": -115.1695
            },
            "ticketPricing": "Free to enter",
            "rating": 4.6,
            "timeToTravel": "From the Bellagio area, it's a 15-20 minute walk or a short bus ride north on the Strip."
          },
          {
            "placeName": "Fall of Atlantis Show",
            "placeDetails": "A free animatronic show inside the Forum Shops at Caesars Palace. It features fire, water, and talking statues telling the story of Atlantis. The show runs every hour.",
            "placeImageUrl": "https://i.ytimg.com/vi/5g_p3ZKHV5c/maxresdefault.jpg",
            "geoCoordinates": {
              "latitude": 36.1167,
              "longitude": -115.1746
            },
            "ticketPricing": "Free",
            "rating": 4.2,
            "timeToTravel": "A short walk from the Venetian, across the street to Caesars Palace."
          },
          {
            "placeName": "LINQ Promenade",
            "placeDetails": "An open-air shopping, dining, and entertainment district. It's free to walk around and enjoy the atmosphere, street performers, and vibrant energy.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/The_Linq_at_night.jpg/1280px-The_Linq_at_night.jpg",
            "geoCoordinates": {
              "latitude": 36.1179,
              "longitude": -115.1711
            },
            "ticketPricing": "Free to enter",
            "rating": 4.5,
            "timeToTravel": "A short walk from Caesars Palace."
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
            "placeDetails": "A vibrant pedestrian mall in Downtown Las Vegas, famous for its Viva Vision light shows on the world's largest video screen, free live music on multiple stages, and a lively atmosphere.",
            "placeImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Fremont_Street_Experience%2C_Las_Vegas%2C_2016.jpg/1920px-Fremont_Street_Experience%2C_Las_Vegas%2C_2016.jpg",
            "geoCoordinates": {
              "latitude": 36.1707,
              "longitude": -115.1439
            },
            "ticketPricing": "Free",
            "rating": 4.6,
            "timeToTravel": "From the Strip, take the Deuce bus northbound. The ride can take 20-40 minutes depending on traffic."
          }
        ]
      }
    ]
  }
}
\`\`\``;

export async function main(userPrompt) {
  const messages = [
    { role: 'user', content: exampleUserPrompt },
    { role: 'assistant', content: exampleAssistantReply },
    { role: 'user', content: userPrompt },
  ];

  const response = await axios.post(
    `${AICREDITS_BASE_URL}/chat/completions`,
    {
      model: MODEL,
      messages,
    },
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_AICREDITS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = response.data?.choices?.[0]?.message?.content ?? '';

  const jsonMatch = result.match(/```json([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : result.trim();

  try {
    const jsonData = JSON.parse(jsonString);
    return jsonData?.travelPlan;
  } catch (e) {
    console.error('Failed to parse JSON:', e);
  }
}
