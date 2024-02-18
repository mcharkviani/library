import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserBookEntity1708265853550 implements MigrationInterface {
  name: string = 'CreateUserBookEntity1708265853550';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_books" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, "book_id" uuid NOT NULL, "last_page_user_looked_at" integer NOT NULL, CONSTRAINT "PK_ac2dea2febcae9d6317dc28fcd8" PRIMARY KEY ("id", "user_id", "book_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_books" ADD CONSTRAINT "FK_e746bb935afa81fbcaed41036f1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_books" ADD CONSTRAINT "FK_2cf4aaa9d796a62fe330a799822" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_books" DROP CONSTRAINT "FK_2cf4aaa9d796a62fe330a799822"`);
    await queryRunner.query(`ALTER TABLE "user_books" DROP CONSTRAINT "FK_e746bb935afa81fbcaed41036f1"`);
    await queryRunner.query(`DROP TABLE "user_books"`);
  }
}
