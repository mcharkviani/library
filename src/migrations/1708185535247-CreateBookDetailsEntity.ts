import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookDetailsEntity1708185535247 implements MigrationInterface {
  name: string = 'CreateBookDetailsEntity1708185535247';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "book_details" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "content" text NOT NULL, "page" integer NOT NULL, "book_id" uuid NOT NULL, CONSTRAINT "PK_c9d2a9a2fc584b177101858e633" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "book_details" ADD CONSTRAINT "FK_ff7ebd9aa7dcdf0d9dd994b8ce5" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "book_details" DROP CONSTRAINT "FK_ff7ebd9aa7dcdf0d9dd994b8ce5"`);
    await queryRunner.query(`DROP TABLE "book_details"`);
  }
}
