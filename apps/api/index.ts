import express from "express"

import { t } from "./trpc/trpc.ts"
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { auth } from "./auth.ts";
import { env } from "./lib/env.ts";
import cors from "cors"
import { appRouter } from "./trpc/routers/index.ts";
import { createContext } from "./trpc/context.ts";
import { authMiddleware } from "./middleware/auth.ts";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { supabase } from "./lib/supabase.ts";
import { prisma } from "./lib/prisma.ts";
import { v4 as uuidv4 } from "uuid";
import path from "path";


const app = express()
const port = 4000
app.all("/api/auth/*splat", toNodeHandler(auth))

app.use(
  cors({
    origin: [env.CORS_ORIGIN, "exp://192.168.201.16:8081", "http://192.168.201.16:8081"],
    credentials: true,
  })
);

app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  

app.use(express.json())

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Only .jpeg, .jpg, .png and .webp files are allowed!"));
  }
});

app.post("/pictureProfilUpdate", authMiddleware, upload.single("image"), async (req: Request, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }


    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("skillmap")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload image to storage" });
    }


    const { data: { publicUrl } } = supabase.storage
      .from("skillmap")
      .getPublicUrl(filePath);


    return res.status(200).json({
      message: "Profile picture updated successfully",
      imageUrl: publicUrl,
    });

  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
})


app.listen(port, () => {
    console.log(`le serveur a bien demarée sur le port ${port}`)
}) 

export type AppRouter = typeof appRouter