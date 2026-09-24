const express = require('express');

const pool = require('./db');

const app = express();

const PORT = 5000;

// Middleware to parse JSON requests

app.use(express.json());

// ========================================
// GET ALL LEADS
// ========================================

app.get("/api/leads", async (req, res) => {
    try {
        const {
            status,
            search,
            sort,
            order,
            page = "1",
            limit = "100"
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        // Pagination validation
        if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
            return res.status(400).json({
                message: "Page must be a positive integer"
            });
        }

        if (
            !Number.isInteger(limitNumber) ||
            limitNumber <= 0 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                message: "Limit must be a positive integer or less than or equal to 100"
            });
        }

        let baseQuery = "SELECT *  FROM leads";
        let countQuery = "SELECT COUNT(*) AS total FROM leads";

        const filterValues = [];
        const conditions = [];

        // Status filter
        if (status) {
            filterValues.push(status);

            conditions.push(
                `status ILIKE $${filterValues.length}`
            );
        }

        // Search by name or phone
        if (search) {
            filterValues.push(`%${search}%`);

            conditions.push(`
                (
                    name ILIKE $${filterValues.length}
                    OR phone LIKE $${filterValues.length}
                )
            `);
        }

        // WHERE clause
        let whereClause = "";

        if (conditions.length > 0) {
            whereClause = " WHERE " + conditions.join(" AND ");
        }

        baseQuery += whereClause;
        countQuery += whereClause;

        // Sorting
        const allowedSortFields = ["id", "name", "status"];

        if (sort) {
            if (!allowedSortFields.includes(sort)) {
                return res.status(400).json({
                    message: "Invalid sort field."
                });
            }

            const sortOrder =
                order && order.toLowerCase() === "desc"
                 ? "DESC"
                 : "ASC";

                baseQuery += ` ORDER BY ${sort} ${sortOrder}`;
        } else {
            baseQuery += " ORDER BY id ASC";
        }

       // Pagination
        const offset = (pageNumber - 1) * limitNumber;

        const dataValues = [
            ...filterValues,
            limitNumber,
            offset
        ];

        const limitParameter = filterValues.length + 1;
        const offsetParameter = filterValues.length + 2;

        baseQuery += `
            LIMIT $${limitParameter}
            OFFSET $${offsetParameter}
        `;

        // Run both queries
        const [dataResult, countResult] = await Promise.all([
            pool.query(baseQuery, dataValues),
            pool.query(countQuery, filterValues)
        ]);

        const totalRecords = Number(countResult.rows[0].total);

        const totalPages = Math.ceil(
            totalRecords / limitNumber
        );

        res.status(200).json({
            data: dataResult.rows,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalRecords,
                totalPages
            }
        });

    } catch (error) {
        console.error("Database query failed: ", error.message);

        res.status(500).json({
            message: "Failed to fetch leads"
        });
    }
});

// ========================================
// GET SINGLE LEAD
// ========================================

app.get("/api/leads/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const result = await pool.query(
            "SELECT * FROM leads WHERE id = $1",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Lead not found"
            });
        }

        res.status(200).json(result.rows[0]);
    }  catch (error) {
        console.error("Database query failed:", error.message);

        res.status(500).json({
            message: "Failed to fetch lead"
        });
    }
});

// ========================================
// CREATE NEW LEAD
// ========================================

app.post("/api/leads", async(req, res) => {
    try {
        const {name, phone, status} = req.body;

        // Validation
        if (!name || !phone || !status) {
            return res.status(400).json({
                message: "Name, phone, and status are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO leads (name, phone, status)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [name, phone, status]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error("Database query failed:", error.message);
        res.status(500).json({
            message: "Failed to create lead"
        })
    }
});

// ========================================
// UPDATE LEAD
// ========================================

app.put("/api/leads/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const { name, phone, status } = req.body;

        // Check whether at least one field is provided for update
        if (
            name === undefined &&
            phone === undefined &&
            status === undefined
        ) {
            return res.status(400).json({
                message: "At least one field is required to update"
            });
        }

        // Validation for name
        if (name !== undefined && name.trim() === "") {
            return res.status(400).json({
                message: "Name cannot be empty"
            })
        }

        // Validation for phone
        if (phone !== undefined && !/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                message: "Phone must be a 10-digit number"
            });
        }

        // Validation for status
        const allowedStatuses = [
            "New",
            "Follow-up",
            "Converted",
            "Lost"
        ];

        if (
            status !== undefined &&
            !allowedStatuses.includes(status)
        ) {
            return res.status(400).json({
                message: "Invalid status."
            });
        }

        const result = await pool.query(
            `UPDATE leads
            SET
                name = COALESCE($1, name),
                phone = COALESCE($2, phone),
                status = COALESCE($3, status)
            WHERE id = $4
            RETURNING *`,
            [name, phone, status, id]
        );

        if (result.rows.length === 0 ) {
            return res.status(404).json({
                message: "Lead not found."
            });
        }

        res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("Database query failed:", error.message);

        res.status(500).json({
            message: "Failed to update lead"
        });

    }
});

// ========================================
// DELETE LEAD
// ========================================

app.delete("/api/leads/:id", async(req, res) => {
    try {
        const id = Number(req.params.id);

        const result = await pool.query(
            `DELETE FROM leads
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0 ) {
            return res.status(404).json({
                message: "Lead not found."
            });
        }

        res.status(200).json({
            message:"Lead deleted successfully",
            lead: result.rows[0]
        });

    } catch (error) {
        console.log("Database query failed:", error.message);

        res.status(500).json({
            message: "Failed to delete lead."
        });

    }
});

// ========================================
// START THE SERVER
// ========================================

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})