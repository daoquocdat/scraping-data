import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { got } from "got";
import { Console, log } from "console";
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const baseUrl = "https://hosocongty.vn/"; // the website url to start scraping from
var totalPages = getTotalpages(baseUrl) | 1;
var parsedResults = [];
var indexPage = 0;
var indexData = 0;
const writeStream = fs.createWriteStream(`data.csv`, "utf-8");
writeStream.write(
  `Stt,Tên công ty,Tên quốc tế,Tên viết tắt,Mã số thuế,Địa chỉ thuế,Đại diện pháp luật,Điện thoại,Email,Ngày cấp,Ngành nghề chính,Trạng thái\n`
);
async function getWebsiteContent(url) {
  console.log(url, "---------------Start---------------");
  axios
    .get(url)
    .then(async (res) => {
      const $ = cheerio.load(res.data);
      const linksHtml = $(".column-left .box_content .hsdn h3 a");
      fs.writeFile(`datahtml.json`, JSON.stringify(res.data), function (err) {
        if (err) throw err;
        console.log("Saved!");
      });
      // Get the pagination
      const totalPages1 = $('input[name="total"]').attr("value");
      console.log("totalPages", totalPages1);
      //scrape all the data on the respective totalPages
      const links = $(".column-left .box_content .hsdn h3 a"); //jquery get all hyperlinks
      await Promise.all([
        links.each(async (index, element) => {
          const urlCallback = baseUrl + $(element).attr("href");
          const data = await getSourceFromUrl(urlCallback);
          exportResults(indexData, data);
          indexData++;
        }),
      ]);
    })
    .catch((err) => {
      throw err;
    });
  indexPage++; // Increment to the next page
  // Add a little  timeout to avoid getting banned by the server
}

async function getSourceFromUrl(thatUrl) {
  const response = await got(thatUrl);
  const $ = cheerio.load(response.body);
  const data = {
    name: "", //tên công ty
    internationalName: "", //tên quốc tế
    shortName: "", //tên viết tắt
    companyTaxCode: "", //mã số thuế
    taxAddress: "", //địa chỉ thuế
    legalRepresentative: "", //đại diện pháp luật
    phone: "", //điện thoại
    email: "", //email
    licenseDate: "", //ngày cấp
    job: "", //ngành nghề chính
    status: "", //trạng thái
  };
  $("label").each((index, element) => {
    console.log($(element).text());
    if ($("h1").text()) {
      data.name = $("h1").text().replace(/,/g, "");
    }
    //internationalName
    if ($(element).text() === " Tên quốc tế:") {
      data.internationalName = $(element).next().text().replace(/,/g, "");
    }
    // shortName
    if ($(element).text() === " Tên viết tắt:") {
      data.shortName = $(element).next().text().replace(/,/g, "");
    }
    // companyTaxCode
    if ($(element).text() === " Mã số thuế:") {
      data.companyTaxCode = $(element).next().text();
    }
    // taxAddress
    if ($(element).text() === " Địa chỉ thuế:") {
      data.taxAddress = $(element).next().text().replace(/,/g, "");
    }
    // legalRepresentative
    if ($(element).text() === " Đại diện pháp luật:") {
      data.legalRepresentative = $(element).next().text();
    }
    // phone
    if ($(element).text() === " Điện thoại:") {
      data.phone = $(element).next().text();
    }
    // email
    if ($(element).text() === " Email:") {
      data.email = $(element).next().text();
    }
    // licenseDate
    if ($(element).text() === " Ngày cấp:") {
      data.licenseDate = $(element).next().text();
    }
    // jobs
    if ($(element).text() === " Ngành nghề chính:") {
      data.job = $(element).next().text().replace(/,/g, " ");
    }
    // status
    if ($(element).text() === " Trạng thái:") {
      data.status = $(element).next().text();
    }
  });
  console.log(data);
  return data;
}

// Get the pagination
export function getTotalpages(url) {
  // Extract the total number of pages available and return it as an integer
  axios.get(url).then(async (res) => {
    const $ = cheerio.load(res.data);

    // Get the pagination
    totalPages = $('input[name="total"]').attr("value");
  });
  return totalPages;
}

export async function mainFlow(url = baseUrl) {
  const page = 4;
  const res = await Promise.all(
    Array.from({ length: page }).map((page, i) => {
      const urlCallback = url + `/page-${i + 1}`;
      getWebsiteContent(urlCallback);
    })
  )
    .then((res) => {
      return res;
    })
    .catch((err) => {
      throw err;
    });
}
//function for export to csv file
export const exportResults = (index, parsedResults) => {
  writeStream.write(
    `${index}, ${parsedResults["name"]}, ${parsedResults["internationalName"]}, ${parsedResults["shortName"]}, ${parsedResults["companyTaxCode"]}, ${parsedResults["taxAddress"]}, ${parsedResults["legalRepresentative"]}, ${parsedResults["phone"]}, ${parsedResults["email"]}, ${parsedResults["legalRepresentative"]}, ${parsedResults["job"]}, ${parsedResults["status"]}\n`
  );
};
