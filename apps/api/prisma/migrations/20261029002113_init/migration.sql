-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254),
    "department" VARCHAR(80),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(40),
    "notes" VARCHAR(500),
    "employee_id" UUID,
    "decommissioned_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_maps" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "cols" SMALLINT NOT NULL,
    "rows" SMALLINT NOT NULL,
    "walls" TEXT[],
    "labels" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "floor_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_map_objects" (
    "id" UUID NOT NULL,
    "map_id" UUID NOT NULL,
    "type_id" VARCHAR(32) NOT NULL,
    "row" SMALLINT NOT NULL,
    "col" SMALLINT NOT NULL,
    "rotation" SMALLINT NOT NULL,
    "employee_id" UUID,

    CONSTRAINT "floor_map_objects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_full_name_idx" ON "employees"("full_name");

-- CreateIndex
CREATE UNIQUE INDEX "devices_code_key" ON "devices"("code");

-- CreateIndex
CREATE INDEX "devices_employee_id_idx" ON "devices"("employee_id");

-- CreateIndex
CREATE INDEX "floor_map_objects_map_id_idx" ON "floor_map_objects"("map_id");

-- CreateIndex
CREATE INDEX "floor_map_objects_employee_id_idx" ON "floor_map_objects"("employee_id");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_map_objects" ADD CONSTRAINT "floor_map_objects_map_id_fkey" FOREIGN KEY ("map_id") REFERENCES "floor_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_map_objects" ADD CONSTRAINT "floor_map_objects_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A decommissioned device can never stay assigned to an employee.
ALTER TABLE "devices" ADD CONSTRAINT "devices_decommissioned_unassigned"
  CHECK ("decommissioned_at" IS NULL OR "employee_id" IS NULL);
