CREATE TABLE "shift_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"agent_name" varchar NOT NULL,
	"team" varchar NOT NULL,
	"monday" varchar DEFAULT 'Off',
	"tuesday" varchar DEFAULT 'Off',
	"wednesday" varchar DEFAULT 'Off',
	"thursday" varchar DEFAULT 'Off',
	"friday" varchar DEFAULT 'Off',
	"saturday" varchar DEFAULT 'Off',
	"sunday" varchar DEFAULT 'Off',
	"timezone" varchar DEFAULT 'GMT' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "trustpilot_reviews" ADD COLUMN "screenshot_url" text;--> statement-breakpoint
ALTER TABLE "shift_schedules" ADD CONSTRAINT "shift_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;