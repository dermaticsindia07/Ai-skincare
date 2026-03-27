

import { GoogleGenAI, GenerateContentResponse, Type, GenerateContentParameters } from "@google/genai";
import { PastProduct, SkinConditionCategory, SkincareRoutine } from '../types';
import { DERMATICS_INDIA_PRODUCTS } from "../productData";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

// Split the API_KEY environment variable by commas to support multiple keys
const apiKeys = process.env.API_KEY.split(',')
    .map(key => key.trim())
    .filter(key => key);

if (apiKeys.length === 0) {
    throw new Error("API_KEY environment variable is set, but contains no valid keys.");
}

// Create an array of GoogleGenAI instances for failover
const aiInstances = apiKeys.map(apiKey => new GoogleGenAI({ apiKey }));

/**
 * Attempts to generate content using a pool of AI instances, failing over to the next key on specific errors.
 * @param params - The parameters for the generateContent call.
 * @returns A promise that resolves with the GenerateContentResponse.
 * @throws An error if all API keys fail.
 */
async function generateContentWithFailover(params: GenerateContentParameters): Promise<GenerateContentResponse> {
    let lastError: Error | null = null;

    for (let i = 0; i < aiInstances.length; i++) {
        const ai = aiInstances[i];
        try {
            const response = await ai.models.generateContent(params);
            // If the call is successful, return the response immediately.
            return response;
        } catch (error) {
            lastError = error as Error;
            console.warn(`API key ${i + 1}/${aiInstances.length} failed: ${lastError.message}`);
            
            const errorMessage = lastError.message.toLowerCase();
            // Check for specific, retriable error messages
            const isRetriable = 
                errorMessage.includes('api key not valid') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('internal error') ||
                errorMessage.includes('500') || // server error
                errorMessage.includes('503'); // service unavailable

            if (!isRetriable) {
                // If the error is not something a key switch can fix (e.g., bad request), throw it immediately.
                throw lastError;
            }
            // Otherwise, the loop will continue and try the next key.
        }
    }

    // If the loop completes without returning, all keys have failed.
    throw new Error(`All ${aiInstances.length} API keys failed. Last error: ${lastError?.message || 'Unknown error'}`);
}


const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const analyzeImage = async (images: File[]): Promise<SkinConditionCategory[]> => {
    if (images.length === 0) {
        throw new Error("No images provided for analysis.");
    }
    try {
        const imageParts = await Promise.all(images.map(fileToGenerativePart));
        const textPart = {
             text: `Analyze these facial images in detail. They may show different angles of the same person's face (e.g., front, left side, right side). Provide one single, consolidated analysis based on all images provided. Identify all potential skin conditions. Group them into relevant categories like 'Acne & Breakouts', 'Oil Control & Sebum', 'Skin Texture & Surface', 'Pigmentation', 'Hydration Levels', 'Signs of Aging', 'Redness & Sensitivity'. 
             
             For each specific condition you identify, provide:
             1. A 'name' for the condition (e.g., 'Pustules').
             2. A 'confidence' score from 0 to 100 on how certain you are.
             3. A 'location' string describing the primary area on the face (e.g., "Forehead", "Cheeks", "Nose", "Chin", "Around Mouth", "General Face").
             4. An array of 'boundingBoxes' showing where you found the condition. Each bounding box object must have an 'imageId' (the 0-based index of the input image it corresponds to) and a 'box' object with normalized coordinates (x1, y1, x2, y2) from 0.0 to 1.0. If a condition is general and not localized, use a location like "General Face" and return an empty array for boundingBoxes.

             Provide the output strictly in JSON format according to the provided schema. Be thorough and identify as many relevant conditions as possible.

             **CRITICAL INSTRUCTION FOR BALANCED ANALYSIS:** Strive to provide a balanced and accurate analysis. It's important to report on the healthy aspects of the skin to give the user a complete picture. If you identify clear, healthy areas, include a 'Healthy Skin' category with specific condition names like 'Clear and Balanced Skin on Forehead' or 'Good Hydration on Cheeks'. However, do not include the 'Healthy Skin' category if the facial images show widespread or severe conditions with no discernible healthy areas. Accuracy is the top priority.
             
             **CRITICAL INSTRUCTION FOR REDNESS:** Be very specific when identifying 'Redness & Sensitivity'. Do not classify a red spot as 'Redness' if that redness is a clear characteristic of another primary condition. For example, an inflamed acne pustule is naturally red; in this case, only identify it as 'Acne' and do not create a separate 'Redness' condition for the same spot. Only use the 'Redness & Sensitivity' category for conditions like rosacea, widespread irritation, flushing, or persistent patches of redness that are not directly and obviously part of another condition like a pimple.
             `
        };

        const response: GenerateContentResponse = await generateContentWithFailover({
            model: 'gemini-2.5-flash',
            contents: { parts: [...imageParts, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING, description: "The category of skin conditions, e.g., 'Acne & Breakouts'." },
                            conditions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING, description: "The specific skin condition name, e.g., 'Hormonal Acne'." },
                                        confidence: { type: Type.NUMBER, description: "The confidence score from 0 to 100." },
                                        location: { type: Type.STRING, description: "The primary facial location of the condition, e.g., 'Forehead'." },
                                        boundingBoxes: {
                                            type: Type.ARRAY,
                                            description: "Array of bounding boxes for this condition.",
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    imageId: { type: Type.NUMBER, description: "0-based index of the image this box applies to." },
                                                    box: {
                                                        type: Type.OBJECT,
                                                        properties: {
                                                            x1: { type: Type.NUMBER, description: "Normalized top-left x coordinate." },
                                                            y1: { type: Type.NUMBER, description: "Normalized top-left y coordinate." },
                                                            x2: { type: Type.NUMBER, description: "Normalized bottom-right x coordinate." },
                                                            y2: { type: Type.NUMBER, description: "Normalized bottom-right y coordinate." }
                                                        },
                                                        required: ["x1", "y1", "x2", "y2"]
                                                    }
                                                },
                                                required: ["imageId", "box"]
                                            }
                                        }
                                    },
                                    required: ["name", "confidence", "location", "boundingBoxes"]
                                }
                            }
                        },
                        required: ["category", "conditions"]
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze skin image. Please try again.");
    }
};


export const generateRoutine = async (
    pastProducts: PastProduct[], 
    analysis: SkinConditionCategory[], 
    goals: string[]
): Promise<{recommendation: SkincareRoutine, title: string}> => {
    const pastProductsString = pastProducts.length > 0 
        ? pastProducts.map(p => `${p.name} (${p.isUsing ? 'currently using' : 'used in past'})`).join(', ') 
        : 'None specified.';
    
    const analysisString = analysis.map(cat => 
        `${cat.category}: ${cat.conditions.map(c => `${c.name} at ${c.location} (${c.confidence}% confidence)`).join(', ')}`
    ).join('; ');

    const goalsString = goals.join(', ');

    const productCatalogString = JSON.stringify(DERMATICS_INDIA_PRODUCTS.map(p => ({
        id: p.id,
        name: p.name,
        url: p.url,
        imageUrl: p.imageUrl,
        description: p.description,
        suitableFor: p.suitableFor,
        keyIngredients: p.keyIngredients,
        variantId: p.variantId,
        price: p.price,
        originalPrice: p.originalPrice
    })), null, 2);

    const prompt = `
        You are a world-class dermatologist and skincare expert for the brand "Dermatics India". Your task is to create a highly personalized and effective skincare routine for a user based on their data. You MUST use products exclusively from the Dermatics India catalog provided below. Your goal is to create the *best* possible routine, recommending as many or as few steps as genuinely necessary for the user's specific conditions and goals.

        **Dermatics India Product Catalog:**
        ${productCatalogString}

        **User Data:**
        - **Previously Used Products:** ${pastProductsString}
        - **AI Skin Analysis Results:** ${analysisString}
        - **Primary Skincare Goals:** ${goalsString}

        **Instructions:**
        1.  **Analyze and Select:** Carefully review the user's analysis and goals. From the "Dermatics India Product Catalog", select the MOST appropriate products to build a cohesive AM and PM routine. Pay close attention to the 'suitableFor' and 'keyIngredients' tags in the product data to match products to the user's skin conditions.
        2.  **Create the Routine:** Construct a step-by-step AM (morning) and PM (evening) routine. Recommend only the products that are essential for an effective routine based on the user's data. For each step, you must provide:
            - \`stepType\`: A single, descriptive word for the routine step (e.g., "Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen", "Treatment").
            - \`productId\`: The exact ID of the **primary** selected product from the catalog (e.g., 'DI-C01').
            - \`variantId\`: The exact variantId of the primary product from the catalog.
            - \`productName\`: The full name of the primary product.
            - \`productUrl\`: The URL for the primary product.
            - \`productImageUrl\`: The URL for the primary product's image.
            - \`price\`: The current price from the catalog.
            - \`originalPrice\`: The original price from the catalog.
            - \`purpose\`: A brief, personalized explanation of WHY this specific product is chosen for the user, linking it to their analysis.
            - \`keyIngredients\`: An array of strings with the key ingredients for this product, taken directly from the catalog. This field is **MANDATORY** and must be accurately populated for every single product recommended.
            - \`alternatives\`: An array of suitable alternative products from the catalog that would also work well for this step. Provide as many genuinely good alternatives as you can find, without a fixed limit. The quality of the match is more important than the quantity. For each alternative, you must provide its \`productId\`, \`variantId\`, \`productName\`, \`productUrl\`, \`productImageUrl\`, \`price\`, \`originalPrice\`, and **most importantly**, the \`keyIngredients\` array. The key ingredients are essential for grouping products for the user. If no good alternatives exist for a step, this array can be empty.
        3.  **Key Ingredients:** Based on the routine you created, identify an array of 4-5 key active ingredients from the selected products.
        4.  **Lifestyle Tips:** Provide an array of general lifestyle and wellness tips that support the user's skin goals.
        5.  **Disclaimer & Introduction:** Provide a standard disclaimer and a brief, encouraging introduction.
        6.  **Routine Title:** Create a short, powerful title for the plan.
        
        **CRITICAL INSTRUCTION FOR PRODUCT CONSISTENCY:** To create a simple, effective, and economical routine, if a specific \`stepType\` (e.g., "Cleanser", "Moisturizer", "Serum") is necessary for both the AM and PM routines, you **MUST** recommend the *exact same product* (using the same \`productId\`) for that step in both routines. Do not recommend two different moisturizers or two different cleansers. For example, if a moisturizer is needed morning and night, use the same one for both. The only major exception is "Sunscreen," which should only ever appear in the AM routine.

        **Output Format:**
        Return a single JSON object. The root object must have a "title" key and a "recommendation" key. The "recommendation" object must contain "introduction", "am", "pm", "keyIngredients", "lifestyleTips", and "disclaimer". The "am" and "pm" arrays must follow the structure defined in Instruction #2. DO NOT recommend any products not in the provided catalog.
    `;

    const alternativeProductSchema = {
        type: Type.OBJECT,
        properties: {
            productId: { type: Type.STRING },
            variantId: { type: Type.STRING },
            productName: { type: Type.STRING },
            productUrl: { type: Type.STRING },
            productImageUrl: { type: Type.STRING },
            price: { type: Type.STRING },
            originalPrice: { type: Type.STRING },
            keyIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["productId", "variantId", "productName", "productUrl", "productImageUrl", "price", "originalPrice", "keyIngredients"]
    };

    const routineStepSchema = {
        type: Type.OBJECT,
        properties: {
            stepType: { type: Type.STRING, description: "A single, descriptive word for the routine step." },
            productId: { type: Type.STRING, description: "The exact ID of the product from the catalog." },
            variantId: { type: Type.STRING, description: "The exact Shopify variant ID for the product." },
            productName: { type: Type.STRING, description: "The full name of the recommended product." },
            productUrl: { type: Type.STRING, description: "The direct URL to the product page." },
            productImageUrl: { type: Type.STRING, description: "The direct URL to the product's image from the catalog." },
            purpose: { type: Type.STRING, description: "Why this specific product is recommended for the user." },
            alternatives: {
                type: Type.ARRAY,
                description: "An array of suitable alternative products from the catalog for this step. Can be empty.",
                items: alternativeProductSchema
            },
            price: { type: Type.STRING },
            originalPrice: { type: Type.STRING },
            keyIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["stepType", "productId", "variantId", "productName", "productUrl", "productImageUrl", "purpose", "alternatives", "price", "originalPrice", "keyIngredients"]
    };

    try {
        const response = await generateContentWithFailover({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A short, powerful title for the plan." },
                        recommendation: {
                            type: Type.OBJECT,
                            properties: {
                                introduction: { type: Type.STRING, description: "A brief, encouraging intro to the plan." },
                                am: {
                                    type: Type.ARRAY,
                                    items: routineStepSchema,
                                    description: "Array of steps for the morning routine using Dermatics India products."
                                },
                                pm: {
                                    type: Type.ARRAY,
                                    items: routineStepSchema,
                                    description: "Array of steps for the evening routine using Dermatics India products."
                                },
                                keyIngredients: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "Array of key ingredient names from the recommended products."
                                },
                                lifestyleTips: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING },
                                    description: "Array of lifestyle and wellness tips."
                                },
                                disclaimer: {
                                    type: Type.STRING,
                                    description: "A final important disclaimer message."
                                }
                            },
                            required: ["introduction", "am", "pm", "keyIngredients", "lifestyleTips", "disclaimer"]
                        }
                    },
                    required: ["title", "recommendation"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating routine with Gemini:", error);
        throw new Error("Failed to generate skincare routine. Please try again.");
    }
};