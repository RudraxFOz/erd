CREATE TABLE "disciplinary_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"moderator_id" integer NOT NULL,
	"admin_id" integer NOT NULL,
	"type" varchar NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"severity" varchar DEFAULT 'medium' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;