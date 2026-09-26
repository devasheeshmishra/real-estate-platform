const {
    getLeads: getLeadsFromService,
    getLeadById: getLeadByIdService,
    createLead: createLeadService,
    updateLead: updateLeadService,
    deleteLead: deleteLeadService
} = require("../services/leadService");

// ========================================
// GET ALL LEADS
// ========================================
const getLeads = async (req, res) => {
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
                message:
                    "Limit must be a positive integer or less than or equal to 100"
            });
        }

       const result = await getLeadsFromService({
        status,
        search,
        sort,
        order,
        pageNumber,
        limitNumber
       });

        res.status(200).json(result);

    } catch (error) {
        console.error(
            "Database query failed:",
            error.message
        );

        res.status(error.statusCode || 500).json({
            message:
                error.statusCode === 400
                    ? error.message
                    : "Failed to fetch leads."
        });
    }
};

// ========================================
// GET SINGLE LEAD
// ========================================
const getLeadById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const lead = await getLeadByIdService(id);

        if (!lead) {
            return res.status(404).json({
                message: "Lead not found."
            })
        }

        res.status(200).json(lead);
    }  catch (error) {
        console.error("Database query failed:", error.message);

        res.status(500).json({
            message: "Failed to fetch lead"
        });
    }
};

// ========================================
// CREATE NEW LEAD
// ========================================

const createLead = async(req, res) => {
    try {
        const {name, phone, status} = req.body || {};

        // Validation
        if (!name || !phone || !status) {
            return res.status(400).json({
                message: "Name, phone, and status are required"
            });
        }

        const lead = await createLeadService({
            name,
            phone,
            status
        });

        res.status(201).json(lead);

    } catch (error) {
        console.error(
            "Database query failed:",
             error.message
            );

        res.status(500).json({
            message: "Failed to create lead"
        });
    }
};

// ========================================
// UPDATE LEAD
// ========================================

const updateLead = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const { name, phone, status } = req.body || {};

        // Check whether at least one field is provided for update
        if (
            name === undefined &&
            phone === undefined &&
            status === undefined
        ) {
            return res.status(400).json({
                message: "At least one field is required to update."
            });
        }

        // Validation for name
        if (name !== undefined && name.trim() === "") {
            return res.status(400).json({
                message: "Name cannot be empty."
            })
        }

        // Validation for phone
        if (phone !== undefined && !/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                message: "Phone number must be a 10-digit number."
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

        const lead = await updateLeadService(id, {
            name,
            phone,
            status
        });

        if (!lead) {
            return res.status(404).json({
                message: "Lead not found."
            });
        }

        res.status(200).json(lead);

    } catch (error) {
        console.error(
            "Database query failed:",
             error.message
        );

        res.status(500).json({
            message: "Failed to update lead"
        });

    }
};

// ========================================
// DELETE LEAD
// ========================================

const deleteLead = async(req, res) => {
    try {
        const id = Number(req.params.id);

        const lead = await deleteLeadService(id);

        if (!lead) {
            return res.status(404).json({
                message: "Lead not found."
            });
        }

        res.status(200).json({
            message:"Lead deleted successfully",
            lead
        });

    } catch (error) {
        console.log("Database query failed:", error.message);

        res.status(500).json({
            message: "Failed to delete lead."
        });

    }
};

module.exports = {
    getLeads,
    getLeadById,
    createLead,
    updateLead,
    deleteLead
};