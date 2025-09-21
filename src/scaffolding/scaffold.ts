/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, UserCancelledError } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import { copyWizardContext } from './copyWizardContext';
import { ChooseComposeStep } from './wizard/ChooseComposeStep';
import { ChoosePlatformStep } from './wizard/ChoosePlatformStep';
import { ChooseWorkspaceFolderStep } from './wizard/ChooseWorkspaceFolderStep';
import { OpenDockerfileStep } from './wizard/OpenDockerfileStep';
import { ScaffoldFileStep } from './wizard/ScaffoldFileStep';
import { ScaffoldingWizardContext } from './wizard/ScaffoldingWizardContext';

export async function scaffold(wizardContext: Partial<ScaffoldingWizardContext>, apiInput?: ScaffoldingWizardContext): Promise<void> {
    if (!vscode.workspace.isTrusted) {
        throw new UserCancelledError('enforceTrust');
    }

    copyWizardContext(wizardContext, apiInput);
    wizardContext.scaffoldType = 'all';

    const promptSteps: AzureWizardPromptStep<ScaffoldingWizardContext>[] = [
        new ChooseWorkspaceFolderStep(),
        new ChoosePlatformStep(),
        new ChooseComposeStep(),
    ];

    const executeSteps: AzureWizardExecuteStep<ScaffoldingWizardContext>[] = [
        new ScaffoldFileStep('.dockerignore', 'ask', 100),
        new ScaffoldFileStep('.containerignore', 'ask', 110),
        new ScaffoldFileStep('Dockerfile', 'ask', 200),
        new OpenDockerfileStep(),
    ];

    const wizard = new AzureWizard<ScaffoldingWizardContext>(wizardContext as ScaffoldingWizardContext, {
        promptSteps: promptSteps,
        executeSteps: executeSteps,
        title: vscode.l10n.t('Add Docker Files'),
    });

    await wizard.prompt();

    if (wizardContext.scaffoldCompose) {
        executeSteps.push(new ScaffoldFileStep('compose.yaml', 'ask', 300));
        executeSteps.push(new ScaffoldFileStep('compose.debug.yaml', 'ask', 400));
    }

    await wizard.execute();
}
