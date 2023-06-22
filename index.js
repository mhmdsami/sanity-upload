const fs = require("fs");
const { createClient } = require("@sanity/client");
const { config } = require("dotenv");

config();

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: true,
  apiVersion: "2023-06-20",
  token: process.env.SANITY_SECRET_TOKEN,
});

const createBackup = async () => {
  const backup = await client.fetch(`*[_type == "teamMembers"]`);
  fs.writeFileSync(`./backup.json`, JSON.stringify(backup));
  console.log("Backup created");
};

const deleteDocuments = async () => {
  const documents = await client.fetch(`*[_type == "teamMembers"]`);
  for (const { _id } of documents) {
    await client.delete(_id);
  }
  console.log("Documents deleted");
};

const uploadDocuments = async () => {
  const members = JSON.parse(fs.readFileSync("./members.json"));

  for (let i = 0; i < members.length; i++) {
    const { name, domain, designation, picture } = members[i];

    try {
      const pictureDoc = await client.assets.upload(
        "image",
        fs.createReadStream(`./images/${picture}`)
      );

      const document = {
        _type: "teamMembers",
        index: i,
        name,
        domain,
        designation,
        picture: {
          _type: "image",
          asset: {
            _type: "reference",
            _ref: pictureDoc._id,
          },
        },
      };

      await client.create(document);
      console.log(`Uploaded ${name}`);
    } catch (error) {
      console.log(`Failed to upload ${name}`);
    }
  }
  console.log("Documents uploaded");
};

const main = async () => {
  await createBackup();
  await deleteDocuments();
  await uploadDocuments();
};

main()
  .then(() => console.log("Done"))
  .catch(console.error);
