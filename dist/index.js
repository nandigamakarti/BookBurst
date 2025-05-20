var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  books: () => books,
  booksRelations: () => booksRelations,
  follows: () => follows,
  followsRelations: () => followsRelations,
  insertBookSchema: () => insertBookSchema,
  insertUserBookSchema: () => insertUserBookSchema,
  insertUserSchema: () => insertUserSchema,
  userBooks: () => userBooks,
  userBooksRelations: () => userBooksRelations,
  userPreferences: () => userPreferences,
  userPreferencesRelations: () => userPreferencesRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  bio: text("bio"),
  profilePicture: text("profile_picture")
});
var usersRelations = relations(users, ({ many }) => ({
  userBooks: many(userBooks),
  followedBy: many(follows, { relationName: "followed" }),
  following: many(follows, { relationName: "follower" })
}));
var books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  coverImage: text("cover_image"),
  genre: text("genre"),
  publicationDate: text("publication_date"),
  isbn: text("isbn")
});
var booksRelations = relations(books, ({ many }) => ({
  userBooks: many(userBooks)
}));
var userBooks = pgTable("user_books", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bookId: integer("book_id").notNull().references(() => books.id),
  status: text("status").notNull(),
  // "reading", "finished", "want_to_read"
  progress: integer("progress"),
  // 0-100%
  rating: integer("rating"),
  // 1-5
  review: text("review"),
  isPublic: boolean("is_public").default(false),
  dateAdded: timestamp("date_added").defaultNow(),
  dateUpdated: timestamp("date_updated").defaultNow()
});
var userBooksRelations = relations(userBooks, ({ one }) => ({
  user: one(users, {
    fields: [userBooks.userId],
    references: [users.id]
  }),
  book: one(books, {
    fields: [userBooks.bookId],
    references: [books.id]
  })
}));
var follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followedId: integer("followed_id").notNull().references(() => users.id)
});
var followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "follower"
  }),
  followed: one(users, {
    fields: [follows.followedId],
    references: [users.id],
    relationName: "followed"
  })
}));
var userPreferences = pgTable("user_preferences", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  theme: text("theme").default("light"),
  lastActiveTab: text("last_active_tab"),
  recentlyViewedBooks: text("recently_viewed_books").array(),
  readingTime: integer("reading_time").default(0),
  lastActiveTimestamp: timestamp("last_active_timestamp").defaultNow()
});
var userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true
});
var insertBookSchema = createInsertSchema(books);
var insertUserBookSchema = createInsertSchema(userBooks).omit({
  id: true,
  dateAdded: true,
  dateUpdated: true
});

// server/db.ts
import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/database-storage.ts
import { eq, and, desc, sql } from "drizzle-orm";
import { scrypt } from "crypto";
import { promisify } from "util";
import session from "express-session";
import connectPg from "connect-pg-simple";
var PostgresSessionStore = connectPg(session);
var scryptAsync = promisify(scrypt);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values({
      ...insertUser,
      bio: null,
      profilePicture: null
    }).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!updatedUser) {
      throw new Error("User not found");
    }
    return updatedUser;
  }
  async getActiveUsers() {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      bio: users.bio,
      profilePicture: users.profilePicture
    }).from(users);
    return allUsers;
  }
  // Book methods
  async getAllBooks() {
    return db.select().from(books);
  }
  async getBook(id) {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book;
  }
  async createBook(insertBook) {
    const existing = await db.select().from(books).where(sql`LOWER(title) = LOWER(${insertBook.title}) AND LOWER(author) = LOWER(${insertBook.author})`).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }
    const [book] = await db.insert(books).values(insertBook).returning();
    return book;
  }
  // User Book methods
  async getUserBooks(userId) {
    const result = await db.select({
      userBook: userBooks,
      book: books
    }).from(userBooks).innerJoin(books, eq(userBooks.bookId, books.id)).where(eq(userBooks.userId, userId));
    return result.map((row) => ({
      ...row.userBook,
      book: row.book
    }));
  }
  async getUserBook(id) {
    const [userBook] = await db.select().from(userBooks).where(eq(userBooks.id, id));
    return userBook;
  }
  async addBookToUser(insertUserBook) {
    const [userBook] = await db.insert(userBooks).values(insertUserBook).returning();
    const book = await this.getBook(userBook.bookId);
    if (!book) throw new Error("Book not found");
    return { ...userBook, book };
  }
  async updateUserBook(id, updates) {
    const [updatedUserBook] = await db.update(userBooks).set({
      ...updates,
      dateUpdated: /* @__PURE__ */ new Date()
    }).where(eq(userBooks.id, id)).returning();
    if (!updatedUserBook) {
      throw new Error("User book not found");
    }
    const book = await this.getBook(updatedUserBook.bookId);
    if (!book) throw new Error("Book not found");
    return { ...updatedUserBook, book };
  }
  async deleteUserBook(id) {
    await db.delete(userBooks).where(eq(userBooks.id, id));
  }
  async getPublicUserBooks(userId) {
    const result = await db.select({
      userBook: userBooks,
      book: books
    }).from(userBooks).innerJoin(books, eq(userBooks.bookId, books.id)).where(
      and(
        eq(userBooks.userId, userId),
        eq(userBooks.isPublic, true)
      )
    );
    return result.map((row) => ({
      ...row.userBook,
      book: row.book
    }));
  }
  // Community methods
  async followUser(followerId, followedId) {
    const existingFollow = await db.select().from(follows).where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followedId, followedId)
      )
    );
    if (existingFollow.length === 0) {
      await db.insert(follows).values({
        followerId,
        followedId
      });
    }
  }
  async unfollowUser(followerId, followedId) {
    await db.delete(follows).where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followedId, followedId)
      )
    );
  }
  async isFollowing(followerId, followedId) {
    const follow = await db.select().from(follows).where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.followedId, followedId)
      )
    );
    return follow.length > 0;
  }
  async getFollowers(userId) {
    const result = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      bio: users.bio,
      profilePicture: users.profilePicture
    }).from(follows).innerJoin(users, eq(follows.followerId, users.id)).where(eq(follows.followedId, userId));
    return result;
  }
  async getFollowing(userId) {
    const result = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      bio: users.bio,
      profilePicture: users.profilePicture
    }).from(follows).innerJoin(users, eq(follows.followedId, users.id)).where(eq(follows.followerId, userId));
    return result;
  }
  async getAllPublicReviews() {
    const result = await db.select({
      userBook: userBooks,
      user: users,
      book: books
    }).from(userBooks).innerJoin(users, eq(userBooks.userId, users.id)).innerJoin(books, eq(userBooks.bookId, books.id)).where(
      and(
        eq(userBooks.isPublic, true),
        sql`${userBooks.review} IS NOT NULL AND ${userBooks.review} <> ''`
      )
    ).orderBy(desc(userBooks.dateUpdated));
    return result.map((row) => ({
      id: row.userBook.id,
      userId: row.userBook.userId,
      bookId: row.userBook.bookId,
      rating: row.userBook.rating,
      review: row.userBook.review,
      date: row.userBook.dateUpdated,
      user: {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        profilePicture: row.user.profile_picture
      },
      book: {
        id: row.book.id,
        title: row.book.title,
        author: row.book.author
      },
      likes: 0,
      // Placeholder for now
      comments: 0
      // Placeholder for now
    }));
  }
  async getAllReviews() {
    const result = await db.select({
      userBook: userBooks,
      user: users,
      book: books
    }).from(userBooks).innerJoin(users, eq(userBooks.userId, users.id)).innerJoin(books, eq(userBooks.bookId, books.id)).where(
      sql`${userBooks.review} IS NOT NULL AND ${userBooks.review} <> ''`
    ).orderBy(desc(userBooks.dateUpdated));
    return result.map((row) => ({
      id: row.userBook.id,
      userId: row.userBook.userId,
      bookId: row.userBook.bookId,
      rating: row.userBook.rating,
      review: row.userBook.review,
      date: row.userBook.dateUpdated,
      user: {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        profilePicture: row.user.profile_picture
      },
      book: {
        id: row.book.id,
        title: row.book.title,
        author: row.book.author
      },
      likes: 0,
      // Placeholder for now
      comments: 0
      // Placeholder for now
    }));
  }
  async getUserBooksWithReviews(userId) {
    const result = await db.select({
      userBook: userBooks,
      book: books
    }).from(userBooks).innerJoin(books, eq(userBooks.bookId, books.id)).where(
      and(
        eq(userBooks.userId, userId),
        sql`${userBooks.review} IS NOT NULL AND ${userBooks.review} <> ''`
      )
    );
    return result.map((row) => ({
      ...row.userBook,
      book: row.book
    }));
  }
  async getTrendingBooks(limit = 10) {
    const result = await db.execute(sql`
      SELECT
        MIN(b.id) as id,
        b.title,
        b.author,
        MIN(b.cover_image) as cover_image,
        MIN(b.genre) as genre,
        MIN(b.publication_date) as publication_date,
        MIN(b.isbn) as isbn,
        COUNT(DISTINCT ub.user_id)::int as count
      FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      GROUP BY LOWER(b.title), LOWER(b.author), b.title, b.author
      ORDER BY count DESC
      LIMIT ${limit}
    `);
    return result.rows.map((row) => {
      const { count, cover_image, ...book } = row;
      return { book: { ...book, coverImage: cover_image }, count: Number(count) };
    });
  }
};

// server/storage.ts
var storage = new DatabaseStorage();

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt as scrypt2, randomBytes as randomBytes2, timingSafeEqual as timingSafeEqual2 } from "crypto";
import { promisify as promisify2 } from "util";
var scryptAsync2 = promisify2(scrypt2);
async function hashPassword(password) {
  const salt = randomBytes2(16).toString("hex");
  const buf = await scryptAsync2(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync2(supplied, salt, 64);
  return timingSafeEqual2(hashedBuf, suppliedBuf);
}
function sessionRefresh(req, res, next) {
  if (req.session) {
    req.session.touch();
  }
  next();
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "BOOKBURST_SECRET_KEY",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1e3 * 60 * 60 * 24 * 7,
      // 1 week
      sameSite: "lax",
      httpOnly: true,
      path: "/"
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(sessionRefresh);
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      const user = await storage.getUserByEmail(email);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByEmail(req.body.email);
    if (existingUser) {
      return res.status(400).send("Email already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
import { z } from "zod";

// server/preferences-routes.ts
import { Router } from "express";

// server/preferences-storage.ts
import { eq as eq2, sql as sql2 } from "drizzle-orm";
var preferencesStorage = {
  async getUserPreferences(userId) {
    const preferences = await db.select().from(userPreferences).where(eq2(userPreferences.userId, userId)).limit(1);
    return preferences[0] || null;
  },
  async updateUserPreferences(userId, updates) {
    const existingPreferences = await this.getUserPreferences(userId);
    if (!existingPreferences) {
      const [newPreferences] = await db.insert(userPreferences).values({ userId, ...updates }).returning();
      return newPreferences;
    }
    const [updatedPreferences] = await db.update(userPreferences).set({
      ...updates,
      lastActiveTimestamp: /* @__PURE__ */ new Date()
    }).where(eq2(userPreferences.userId, userId)).returning();
    return updatedPreferences;
  },
  async updateReadingTime(userId, additionalTime) {
    await db.update(userPreferences).set({
      readingTime: sql2`${userPreferences.readingTime} + ${additionalTime}`,
      lastActiveTimestamp: /* @__PURE__ */ new Date()
    }).where(eq2(userPreferences.userId, userId));
  },
  async addRecentlyViewedBook(userId, bookId) {
    const preferences = await this.getUserPreferences(userId);
    const recentBooks = preferences?.recentlyViewedBooks || [];
    const updatedBooks = [String(bookId), ...recentBooks.filter((id) => id !== String(bookId))].slice(0, 10);
    await this.updateUserPreferences(userId, {
      recentlyViewedBooks: updatedBooks
    });
  }
};

// server/preferences-routes.ts
var preferencesRouter = Router();
preferencesRouter.get("/", async (req, res) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const preferences = await preferencesStorage.getUserPreferences(req.user.id);
    res.json(preferences);
  } catch (error) {
    console.error("Error getting preferences:", error);
    res.sendStatus(500);
  }
});
preferencesRouter.put("/", async (req, res) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const preferences = await preferencesStorage.updateUserPreferences(req.user.id, req.body);
    res.json(preferences);
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.sendStatus(500);
  }
});
preferencesRouter.post("/reading-time", async (req, res) => {
  if (!req.user) return res.sendStatus(401);
  const { additionalTime } = req.body;
  if (typeof additionalTime !== "number") {
    return res.status(400).json({ error: "Invalid reading time" });
  }
  try {
    await preferencesStorage.updateReadingTime(req.user.id, additionalTime);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error updating reading time:", error);
    res.sendStatus(500);
  }
});
preferencesRouter.post("/recently-viewed/:bookId", async (req, res) => {
  if (!req.user) return res.sendStatus(401);
  const bookId = parseInt(req.params.bookId);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: "Invalid book ID" });
  }
  try {
    await preferencesStorage.addRecentlyViewedBook(req.user.id, bookId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error adding recently viewed book:", error);
    res.sendStatus(500);
  }
});

// server/routes.ts
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.use("/api/preferences", preferencesRouter);
  app2.get("/", (req, res) => {
    res.sendFile("/index.html", { root: "./dist" });
  });
  app2.get("/auth/login", (req, res) => {
    res.sendFile("/auth.html", { root: "./dist" });
  });
  app2.get("/auth/register", (req, res) => {
    res.sendFile("/auth.html", { root: "./dist" });
  });
  app2.get("/bookshelf", (req, res) => {
    if (!req.isAuthenticated()) {
      res.redirect("/auth/login");
      return;
    }
    res.sendFile("/bookshelf.html", { root: "./dist" });
  });
  app2.get("/profile", (req, res) => {
    if (!req.isAuthenticated()) {
      res.redirect("/auth/login");
      return;
    }
    res.sendFile("/profile.html", { root: "./dist" });
  });
  app2.get("/api/books", async (req, res) => {
    try {
      const books2 = await storage.getAllBooks();
      res.json(books2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });
  app2.get("/api/books/:id", async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      const book = await storage.getBook(bookId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });
  app2.post("/api/books", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const bookData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(bookData);
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create book" });
    }
  });
  app2.get("/api/user-books", async (req, res) => {
    try {
      let userId = req.query.userId ? parseInt(req.query.userId) : null;
      const withReviews = req.query.withReviews === "true";
      let books2;
      if (!userId && req.isAuthenticated() && req.user) {
        userId = req.user.id;
      }
      if (userId && withReviews) {
        books2 = await storage.getUserBooksWithReviews(userId);
      } else if (userId) {
        books2 = await storage.getUserBooks(userId);
      } else {
        return res.status(req.isAuthenticated() ? 400 : 401).json({ message: req.isAuthenticated() ? "Missing userId parameter" : "Not authenticated" });
      }
      res.json(books2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user books" });
    }
  });
  app2.post("/api/user-books", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const userId = req.user.id;
      const userBookData = insertUserBookSchema.parse({
        ...req.body,
        userId
      });
      const userBook = await storage.addBookToUser(userBookData);
      res.status(201).json(userBook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user book data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add book to user" });
    }
  });
  app2.patch("/api/user-books/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const userBookId = parseInt(req.params.id);
      const userId = req.user.id;
      const userBook = await storage.getUserBook(userBookId);
      if (!userBook || userBook.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this book" });
      }
      const updatedUserBook = await storage.updateUserBook(userBookId, req.body);
      res.json(updatedUserBook);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user book" });
    }
  });
  app2.delete("/api/user-books/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const userBookId = parseInt(req.params.id);
      const userId = req.user.id;
      const userBook = await storage.getUserBook(userBookId);
      if (!userBook || userBook.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this book" });
      }
      await storage.deleteUserBook(userBookId);
      res.status(200).json({ message: "Book successfully removed from shelf" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user book" });
    }
  });
  app2.get("/api/users", async (req, res) => {
    try {
      const users2 = await storage.getActiveUsers();
      const usersWithFollowers = await Promise.all(users2.map(async (user) => {
        const followers = await storage.getFollowers(user.id);
        return {
          ...user,
          followersCount: followers.length
        };
      }));
      res.json(usersWithFollowers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const userId = parseInt(req.params.id);
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized to update this user" });
      }
      const { name, bio } = req.body;
      const updates = {};
      if (name !== void 0) updates.name = name;
      if (bio !== void 0) updates.bio = bio;
      const updatedUser = await storage.updateUser(userId, updates);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.get("/api/users/:id/books", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const publicUserBooks = await storage.getPublicUserBooks(userId);
      res.json(publicUserBooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user books" });
    }
  });
  app2.get("/api/users/:id/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log("GET /api/users/:id/profile userId =", userId);
      const user = await storage.getUser(userId);
      console.log("GET /api/users/:id/profile user =", user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      const publicBooks = await storage.getPublicUserBooks(userId);
      const followers = await storage.getFollowers(userId);
      const following = await storage.getFollowing(userId);
      res.json({
        user: userWithoutPassword,
        publicBooks,
        followersCount: followers.length,
        followingCount: following.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  app2.post("/api/follow/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const followerId = req.user.id;
      const followedId = parseInt(req.params.id);
      if (followerId === followedId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      await storage.followUser(followerId, followedId);
      res.status(201).json({ message: "User followed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to follow user" });
    }
  });
  app2.delete("/api/follow/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const followerId = req.user.id;
      const followedId = parseInt(req.params.id);
      await storage.unfollowUser(followerId, followedId);
      res.status(200).json({ message: "User unfollowed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });
  app2.get("/api/follow/status/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const followerId = req.user.id;
      const followedId = parseInt(req.params.id);
      const isFollowing = await storage.isFollowing(followerId, followedId);
      res.json({ isFollowing });
    } catch (error) {
      res.status(500).json({ message: "Failed to check follow status" });
    }
  });
  app2.get("/api/reviews", async (req, res) => {
    try {
      const result = await storage.getAllReviews();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.get("/api/trending-books", async (req, res) => {
    try {
      const trendingBooks = await storage.getTrendingBooks(10);
      res.json(trendingBooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending books" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
var vite_config_default = defineConfig({
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    }
  },
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    host: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
async function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "dist/public");
  if (!fs.existsSync(distPath)) {
    log(`Could not find the build directory: ${distPath}, attempting to build the client first`);
    try {
      const { build } = await import("vite");
      await build({
        ...vite_config_default,
        build: {
          outDir: "dist/public",
          emptyOutDir: true
        }
      });
    } catch (error) {
      log(`Failed to build client: ${error}`);
      throw new Error(`Failed to build client. Original error: ${error}`);
    }
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  const PORT = process.env.PORT || 3e3;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    await serveStatic(app);
  }
})();
