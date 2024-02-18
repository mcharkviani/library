import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  override tableName(className: string, customName: string): string {
    return customName ? customName : snakeCase(className);
  }

  override columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return snakeCase(embeddedPrefixes.concat('').join('_')) + (customName ? customName : snakeCase(propertyName));
  }

  override relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(relationName + '_' + referencedColumnName);
  }

  override joinTableName(firstTableName: string, secondTableName: string, firstPropertyName: string): string {
    return snakeCase(firstTableName + '_' + firstPropertyName.replace(/\./gi, '_') + '_' + secondTableName);
  }

  override joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return snakeCase(tableName + '_' + (columnName ? columnName : propertyName));
  }
}
