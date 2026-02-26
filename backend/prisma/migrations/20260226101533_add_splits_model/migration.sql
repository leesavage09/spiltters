-- CreateTable
CREATE TABLE "splits" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "emoji" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "split_users" (
    "split_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "split_users_pkey" PRIMARY KEY ("split_id","user_id")
);

-- AddForeignKey
ALTER TABLE "split_users" ADD CONSTRAINT "split_users_split_id_fkey" FOREIGN KEY ("split_id") REFERENCES "splits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_users" ADD CONSTRAINT "split_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
