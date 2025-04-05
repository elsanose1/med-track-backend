const fs = require("fs").promises;
const path = require("path");

async function loadExistingProgress(outputDir) {
  const progressFile = path.join(outputDir, "progress.json");
  const dataFile = path.join(outputDir, "fda_products.json");
  try {
    const progressExists = await fs
      .access(progressFile)
      .then(() => true)
      .catch(() => false);
    const dataExists = await fs
      .access(dataFile)
      .then(() => true)
      .catch(() => false);

    if (progressExists && dataExists) {
      const progress = JSON.parse(await fs.readFile(progressFile, "utf8"));
      const existingData = JSON.parse(await fs.readFile(dataFile, "utf8"));
      console.log(`Resuming from previous progress: ${progress.skip} products`);
      return { skip: progress.skip, allProducts: existingData };
    }
  } catch (error) {
    console.log("No valid previous progress found, starting from beginning");
  }
  return { skip: 0, allProducts: [] };
}

async function saveProgress(outputDir, skip, allProducts) {
  const progressFile = path.join(outputDir, "progress.json");
  const outputFile = path.join(outputDir, "fda_products.json");

  await Promise.all([
    fs.writeFile(progressFile, JSON.stringify({ skip }, null, 2)),
    fs.writeFile(outputFile, JSON.stringify(allProducts, null, 2)),
  ]);
}

async function getAllProductsFromFDA(retryCount = 3, retryDelay = 10000) {
  const limit = 1000; // Maximum allowed by the API
  let hasMore = true;
  const outputDir = "fda_data";

  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Created/verified output directory: ${outputDir}`);

    // Load existing progress if available
    const { skip: initialSkip, allProducts: initialProducts } =
      await loadExistingProgress(outputDir);
    let skip = initialSkip;
    let allProducts = initialProducts;

    while (hasMore) {
      let success = false;
      let retries = 0;

      while (!success && retries < retryCount) {
        try {
          console.log(`Fetching products from ${skip} to ${skip + limit}...`);
          const response = await fetch(
            `https://api.fda.gov/drug/label.json?api_key=ORfbqYoAbiSRfbwElWDdtsSOQMtIKsYIAm3XEDmv&limit=${limit}&skip=${skip}`
          );

          if (!response.ok) {
            throw new Error(
              `FDA API request failed with status: ${response.status}`
            );
          }

          const data = await response.json();

          if (!data.results || data.results.length === 0) {
            console.log("No more results available.");
            hasMore = false;
            break;
          }

          allProducts = [...allProducts, ...data.results];

          // Save progress
          await saveProgress(outputDir, skip + limit, allProducts);
          console.log(
            `Updated progress with ${allProducts.length} total products`
          );

          skip += limit;
          success = true;

          // Check if we've reached the total number of results
          if (skip >= data.meta.results.total) {
            console.log(
              `Reached total number of results (${data.meta.results.total})`
            );
            hasMore = false;
          }

          console.log(
            `Progress: ${allProducts.length}/${
              data.meta.results.total
            } products fetched (${(
              (allProducts.length / data.meta.results.total) *
              100
            ).toFixed(2)}%)`
          );
        } catch (error) {
          retries++;
          if (retries < retryCount) {
            console.log(
              `Attempt ${retries}/${retryCount} failed. Retrying in ${
                retryDelay / 1000
              } seconds...`
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          } else {
            console.error(
              `Failed after ${retryCount} attempts. Last error:`,
              error
            );
            throw error;
          }
        }
      }

      // Add delay between successful requests to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log("Finished fetching all products successfully!");
    return allProducts;
  } catch (error) {
    console.error("Error fetching products from FDA:", error);
    throw error;
  }
}

// Start the process with 3 retry attempts and 10 second delay between retries
getAllProductsFromFDA(100, 25000).catch((error) => {
  console.error("Fatal error occurred:", error);
  process.exit(1);
});
