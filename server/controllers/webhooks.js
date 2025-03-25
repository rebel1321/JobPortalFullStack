import { Webhook } from "svix";
import User from "../models/User.js";

// API Controller function to manage Clerk user with database
export const clerkWebhooks = async (req, res) => {
    try {
        // Check required headers
        const svixHeaders = ["svix-id", "svix-timestamp", "svix-signature"];
        for (const header of svixHeaders) {
            if (!req.headers[header]) {
                return res.status(400).json({ success: false, message: `Missing ${header} header` });
            }
        }

        // Create a Svix instance with Clerk webhook secret
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        // Verifying headers
        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        });

        // Getting data from request body
        const { data, type } = req.body;

        // Switch case for different events
        switch (type) {
            case 'user.created': {
                try {
                    const userData = {
                        _id: data.id,
                        email: data.email_addresses?.[0]?.email_address || "No Email",
                        name: `${data.first_name} ${data.last_name}`,
                        image: data.image_url,
                        resume: ""
                    };
                    await User.create(userData);
                    console.log("User Created:", userData);
                    return res.json({});
                } catch (error) {
                    console.error("User Creation Error:", error.message);
                    return res.status(500).json({ success: false, message: error.message });
                }
            }
            case 'user.updated': {
                try {
                    const userData = {
                        email: data.email_addresses?.[0]?.email_address || "No Email",
                        name: `${data.first_name} ${data.last_name}`,
                        image: data.image_url,
                    };
                    await User.findByIdAndUpdate(data.id, userData);
                    return res.json({});
                } catch (error) {
                    console.error("User Update Error:", error.message);
                    return res.status(500).json({ success: false, message: error.message });
                }
            }
            case 'user.deleted': {
                try {
                    await User.findByIdAndDelete(data.id);
                    return res.json({});
                } catch (error) {
                    console.error("User Deletion Error:", error.message);
                    return res.status(500).json({ success: false, message: error.message });
                }
            }
            default:
                return res.status(400).json({ success: false, message: "Invalid webhook event type" });
        }
    } catch (error) {
        console.error("Webhook Error:", error.message);
        return res.status(500).json({ success: false, message: "Webhooks Error" });
    }
};
