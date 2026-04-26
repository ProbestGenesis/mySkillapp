import z from "zod"

export const postsSchema = z.object({
    profession: z.object({
      value: z.enum([
        "Électricien",
        "Électronicien",
        "Maçon",
        "Charpentier",
        "Coffreur-ferrailleur",
        "Terrassier",
        "Peintre bâtiment",
        "Poseur de revêtement",
        "Décorateur intérieur",
        "Plombier",
        "Frigoriste",
        "Installateur solaire",
        "Technicien domotique",
        "Menuisier (aluminium / bois / PVC)",
        "Soudeur / ferronnier",
        "Agent de voirie",
      ]),
      label: z.enum([
        "Électricien",
        "Électronicien",
        "Maçon",
        "Charpentier",
        "Coffreur-ferrailleur",
        "Terrassier",
        "Peintre bâtiment",
        "Poseur de revêtement",
        "Décorateur intérieur",
        "Plombier",
        "Frigoriste",
        "Installateur solaire",
        "Technicien domotique",
        "Menuisier (aluminium / bois / PVC)",
        "Soudeur / ferronnier",
        "Agent de voirie",
      ]),
    }),
    body: z.string().min(50, {
      message: "Veuillez saisir au moins 50 caractères pour décrire vos besoins",
    }),
  });
  
  export const registerForm = z
    .object({
      phone: z.string().nonempty("Veuillez saisir votre numéro de téléphone"),
      password: z
        .string()
        .nonempty("Veuillez saisir votre mot de passe")
        .min(6, {
          message: "le mot de passe doit contenir au moins 6 caractères",
        }),
      confirmPassword: z
        .string()
        .nonempty("Veuillez resaisir votre mot de passe"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Les mots de passe ne correspondent pas",
      path: ["confirmPassword"],
    });
  
  export const personalDataForm = z.object({
    name: z.string().nonempty("Veuillez saisir votre nom complet"),
    email: z.string().optional(),
  });
  
  export const signInForm = z.object({
    phone: z.string().nonempty("Veuillez saisir votre numéro de télephone"),
    password: z
      .string()
      .nonempty("Veuillez saisir votre mot de passe")
      .min(6, { message: "le mot de passe doit contenir au moins 6 caractères" }),
  });
  
  export const createProvider = z.object({
    profession: z.object({
      value: z.enum([
        "Maçon",
        "Charpentier",
        "Électricien",
        "Coffreur-ferrailleur",
        "Terrassier",
        "Peintre en bâtiment",
        "Poseur de revêtement",
        "Plâtrier-staffeur",
        "Poseur de faux plafonds",
        "Décorateur intérieur",
        "Plombier",
        "Frigoriste",
        "Installateur solaire",
        "Technicien domotique",
        "Menuisier (aluminium / bois / PVC)",
        "Soudeur / ferronnier",
        "Poseur de clôtures / portails",
        "Paysagiste",
        "Agent VRD",
      ]),
      label: z.enum([
        "Maçon",
        "Charpentier",
        "Électricien",
        "Coffreur-ferrailleur",
        "Terrassier",
        "Peintre en bâtiment",
        "Poseur de revêtement",
        "Plâtrier-staffeur",
        "Poseur de faux plafonds",
        "Décorateur intérieur",
        "Plombier",
        "Frigoriste",
        "Installateur solaire",
        "Technicien domotique",
        "Menuisier (aluminium / bois / PVC)",
        "Soudeur / ferronnier",
        "Poseur de clôtures / portails",
        "Paysagiste",
        "Agent VRD",
      ]),
    }),
    bio: z
      .string()
      .min(20, {
        message:
          "Veuillez saisir au moins 20 caracètre pour décrire vos compétences",
      }),
    availability: z.object({
      value: z.enum(["7j/7", "Lundi-Samedi", "week-end"]),
      label: z.enum(["7j/7", "Lundi-Samedi", "week-end"]),
    }),
    experience: z.number().nonoptional("Veuillez saisir votre nombre d'années d'experience")
  });
  
  export const createSkill = z.object({
    title: z.string().nonempty("Veuilez saisir le nom du service"),
    description: z
      .string()
      .min(20, {
        message: "Veuillez saisir au moins 20 caracètre pour décrire ce service",
      }),
    averagePrice: z
      .string()
      .nonempty("Veuillez saisir le prix de base de ce service"),
  });
  
  export const createSerciveDemand = z.object({
    description: z
      .string()
      .min(10, {
        message: "Veuillez saisir au moins 10 caracètre pour décrire vos besoins",
      }),
    district: z.string().optional(),
  });
  
  export const secretCode = z.object({
    code: z.string().min(5, { message: "Le code doit contenir 5 caractères" }),
  });
  
  export const position = z.object({
    district: z
      .string()
      .nonempty("Message vueillez entrer le nom de votre quartier"),
    city: z.string().optional(),
  });
  
  export const updatePersonalProfileSchema = z.object({
    name: z.string().nonempty("Veuillez saisir votre nom complet"),
    phoneNumber: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
  });

  export const updateProviderProfileSchema = z.object({
    profession: z.object({
      value: z.string(),
      label: z.string(),
    }),
    bio: z.string().min(20, "Veuillez saisir au moins 20 caractères"),
    availability: z.object({
      value: z.enum(["7j/7", "Lundi-Samedi", "week-end"]),
      label: z.enum(["7j/7", "Lundi-Samedi", "week-end"]),
    }),
    average_price: z.string().optional(),
  });

  
  
  export const providerAveragePriceSchema  = z.object({
    average_price: z.string().nonempty("Veuillez saisir votre prix de base"),
  })
  
  export const addUsername = z.object({
    username: z.string().nonempty("Veuillez saisir votre mot de passe")
  })