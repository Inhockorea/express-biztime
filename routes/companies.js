/** routes for companies */

const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

/**Returns list of companies, like {companies: [{code, name}, ...]}*/
router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT *
       FROM companies
      `
    );
    return res.json({ "companies": result.rows });
  }
  catch (err) {
    return next(err);
  }
});

/**Return obj of company: {company: {code, name, description}}
If the company given cannot be found, this should return a 404 status response.*/

//EDITED for many to many 
router.get("/:code", async function (req, res, next) {
  try {
    let code = req.params.code;

    const companyResult = await db.query(
      `SELECT code, name, description
       FROM companies
       WHERE code = $1`,
      [code]
    );

    const invoiceResult = await db.query(
      `SELECT id
      FROM invoices
      WHERE comp_code = $1`,
      [code]
    );

    let result = companyResult.rows[0];
    result.invoices = invoiceResult.rows.map(r => r.id);

    if (result.length !== 0) {
      return res.json({result:result})
    } else {
      throw new ExpressError("Not Found", 404);
    }

  }
  catch (err) {
    return next(err);
  }
})
//TODO: CODE NAME DESCRIPTION INSTEAD OF SELECT * BE SPECIFIC// also picky about quotting keys res.json

/**Adds a company. Needs to be given JSON like: {code, name, description}
Returns obj of new company: {company: {code, name, description}}*/

router.post("/", async function (req, res, next) {
  try {
    let { code, name, description } = req.body;

    const result = await db.query(
      `INSERT INTO companies (code, name, description)
       VALUES ($1, $2, $3)
       RETURNING code, name, description`,
      [code, name, description]
    );

    return res.status(201).json(result.rows[0])
  }
  catch (err) {
    return next(err);
  }
});

/**Edit existing company. Should return 404 if company cannot be found.
Needs to be given JSON like: {name, description}.
Returns update company object: {company: {code, name, description}}.*/
router.put("/:code", async function (req, res, next) {
  try {
    let { name, description } = req.body;
    let code = req.params.code;

    const result = await db.query(
      `UPDATE companies
       SET name = $1, description = $2
       WHERE code = $3
       RETURNING code, name, description`,
      [name, description, code]
    );

    if (result.rows.length !== 0) {
      return res.status(200).json(result.rows[0])
    } else {
      throw new ExpressError("Not Found", 404);
    }
  }
  catch (err) {
    return next(err);
  }
})

/**Deletes company.
Should return 404 if company cannot be found.
Returns {status: "deleted"}*/
router.delete("/:code", async function (req, res, next) {
  try {
    let code = req.params.code;

    const result = await db.query(
      `DELETE FROM companies
       WHERE code = $1
       RETURNING code`,
      [code]
    );

    if (result.rows[0].code === code) {
      return res.json({ status: "deleted" });
    } else {
      throw new ExpressError("Not Found", 404);
    }
  }
  catch (err) {
    return next(err);
  }
})

module.exports = router